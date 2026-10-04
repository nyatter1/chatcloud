import { ProfileData } from '../types/bio';
import { ChatMessage, GambleResultPayload } from '../types/chat';
import { SYSTEM_BOT } from '../constants/systemBot';
import { saveUserToFirestore, setRiggedUserInFirestore, getUserFromFirestore } from '../services/firestoreService';
import { getRankConfig, RANKS } from '../constants/ranks';
import { RankId } from '../types/ranks';
import { addAuditLog } from './auditLogger';

export interface CommandExecutionResult {
  isCommand: boolean;
  publicMessage?: ChatMessage;
  privateFeedback?: {
    type: 'success' | 'error' | 'info';
    message: string;
  };
  updatedProfile?: ProfileData;
  clearChat?: boolean;
}

// Rigged users helper in localStorage
export function getRiggedUsers(): string[] {
  try {
    const raw = localStorage.getItem('chatcloud_rigged_users');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function isUserRigged(username: string): boolean {
  const users = getRiggedUsers();
  return users.some((u) => u.toLowerCase() === username.trim().toLowerCase());
}

export function setRiggedStatus(username: string, rigged: boolean) {
  try {
    const users = getRiggedUsers();
    const cleanName = username.trim().toLowerCase();
    const filtered = users.filter((u) => u.toLowerCase() !== cleanName);
    if (rigged) {
      filtered.push(cleanName);
    }
    localStorage.setItem('chatcloud_rigged_users', JSON.stringify(filtered));
  } catch {}

  try {
    setRiggedUserInFirestore(username, rigged).catch(() => {});
  } catch {}
}

export function handleChatCommand(
  rawInput: string,
  currentUser: ProfileData
): CommandExecutionResult {
  const trimmed = rawInput.trim();
  if (!trimmed.startsWith('/')) {
    return { isCommand: false };
  }

  const parts = trimmed.slice(1).split(/\s+/);
  const command = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  const wallet = {
    ruby: currentUser.wallet?.ruby ?? 5,
    gold: currentUser.wallet?.gold ?? 1000,
  };

  const isDev =
    currentUser.rank === 'DEV' ||
    currentUser.username.trim().toLowerCase() === 'null';

  const now = new Date();
  const formattedTime = now.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  // ==========================================
  // DEV-ONLY COMMANDS
  // ==========================================

  // 1. /CLEAR (DEV ONLY)
  if (command === 'clear') {
    if (!isDev) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Only Developers can use /clear.',
        },
      };
    }

    const publicMessage: ChatMessage = {
      id: `bot-clear-${Date.now()}`,
      senderId: 'system',
      senderName: SYSTEM_BOT.name,
      senderHandle: SYSTEM_BOT.handle,
      senderAvatar: SYSTEM_BOT.avatar,
      isSystemBot: true,
      content: `Chat cleared by ${currentUser.username}!`,
      timestamp: Date.now(),
      formattedTime,
    };

    return {
      isCommand: true,
      clearChat: true,
      publicMessage,
    };
  }

  // 2. /RANK COMMAND (STAFF: DEV, FOUNDER, CO-OWNER, SUPERADMIN, ADMIN)
  // Usage: /rank (username) rank OR /rank username rank
  if (command === 'rank') {
    const canRank =
      isDev ||
      currentUser.rank === 'FOUNDER' ||
      currentUser.rank === 'CO-OWNER' ||
      currentUser.rank === 'SUPERADMIN' ||
      currentUser.rank === 'ADMIN';

    if (!canRank) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Only Staff (Admin, Founder, Dev) can use /rank.',
        },
      };
    }

    // Match /rank (username) rank or /rank username rank or /rank "username" rank
    const match = trimmed.match(/^\/rank\s+(?:\(([^)]+)\)|"([^"]+)"|(\S+))\s+(.+)$/i);
    if (!match) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Usage: /rank (username) rank — e.g. /rank (hayden) admin',
        },
      };
    }

    const rawTarget = (match[1] || match[2] || match[3] || '').trim().replace(/^[@]+/g, '');
    const rawRank = (match[4] || '').trim().replace(/^[()"]+|[()"]+$/g, '');

    if (!rawTarget || !rawRank) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Usage: /rank (username) rank — e.g. /rank (hayden) admin',
        },
      };
    }

    const rankAliases: Record<string, RankId> = {
      dev: 'DEV',
      developer: 'DEV',
      founder: 'FOUNDER',
      mop: 'MOP',
      coowner: 'CO-OWNER',
      'co-owner': 'CO-OWNER',
      co_owner: 'CO-OWNER',
      superadmin: 'SUPERADMIN',
      'super-admin': 'SUPERADMIN',
      admin: 'ADMIN',
      administrator: 'ADMIN',
      mod: 'MODERATOR',
      moderator: 'MODERATOR',
      bot: 'BOT',
      elite: 'ELITE',
      supervip: 'SUPER-VIP',
      'super-vip': 'SUPER-VIP',
      vip: 'VIP',
    };

    const cleanRankKey = rawRank.toLowerCase().trim();
    const matchedRankId: RankId | undefined =
      rankAliases[cleanRankKey] ||
      (RANKS[rawRank.toUpperCase() as RankId] ? (rawRank.toUpperCase() as RankId) : undefined);

    if (!matchedRankId) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: `Unknown rank "${rawRank}". Available: DEV, FOUNDER, MOP, CO-OWNER, SUPERADMIN, ADMIN, MODERATOR, BOT, ELITE, SUPER-VIP, VIP.`,
        },
      };
    }

    const rankConfig = getRankConfig(matchedRankId);
    const cleanTarget = rawTarget.toLowerCase();

    // Check if ranking current user
    let updatedProfile: ProfileData | undefined;
    if (cleanTarget === currentUser.username.toLowerCase()) {
      updatedProfile = {
        ...currentUser,
        rank: matchedRankId,
      };
    }

    // Persist to local storage if present
    try {
      const rawAccounts = localStorage.getItem('chatcloud_users');
      if (rawAccounts) {
        const accounts: Record<string, ProfileData> = JSON.parse(rawAccounts);
        if (accounts[cleanTarget]) {
          accounts[cleanTarget] = {
            ...accounts[cleanTarget],
            rank: matchedRankId,
          };
          localStorage.setItem('chatcloud_users', JSON.stringify(accounts));
        }
      }
    } catch {}

    // Update live in Firestore
    getUserFromFirestore(rawTarget)
      .then((existing) => {
        if (existing) {
          saveUserToFirestore({
            ...existing,
            rank: matchedRankId,
          }).catch(console.error);
        } else {
          saveUserToFirestore({
            username: rawTarget,
            rank: matchedRankId,
            profilePicture: null,
            banner: null,
            mood: '',
            bioSegments: [],
          }).catch(console.error);
        }
      })
      .catch(console.error);

    // Audit log
    addAuditLog(
      currentUser.username,
      'Ranked User via Command',
      `${currentUser.username} set ${rawTarget}'s rank to ${rankConfig?.name || matchedRankId} using /rank`,
      'admin'
    );

    const publicMessage: ChatMessage = {
      id: `bot-rank-${Date.now()}`,
      senderId: 'system',
      senderName: SYSTEM_BOT.name,
      senderHandle: SYSTEM_BOT.handle,
      senderAvatar: SYSTEM_BOT.avatar,
      isSystemBot: true,
      content: `🎉 ${rawTarget} has been ranked up to ${rankConfig?.name || matchedRankId} by ${currentUser.username}!`,
      timestamp: Date.now(),
      formattedTime,
    };

    return {
      isCommand: true,
      publicMessage,
      updatedProfile,
      privateFeedback: {
        type: 'success',
        message: `Successfully set ${rawTarget}'s rank to ${rankConfig?.name || matchedRankId}!`,
      },
    };
  }

  // 3. /GIVE (DEV ONLY)
  // Usage: /give <gold|rubies> <username> <amount>
  if (command === 'give') {
    if (!isDev) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Only Developers can use /give.',
        },
      };
    }

    const rawCurrency = args[0]?.toLowerCase();
    const targetUsername = args[1];
    const rawAmount = args[2];

    if (!rawCurrency || !targetUsername || !rawAmount) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Usage: /give <gold|rubies> <username> <amount>',
        },
      };
    }

    const isRuby = rawCurrency === 'ruby' || rawCurrency === 'rubies';
    const isGold = rawCurrency === 'gold';

    if (!isRuby && !isGold) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Invalid currency. Use "gold" or "rubies".',
        },
      };
    }

    const amount = parseInt(rawAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Amount must be a positive integer.',
        },
      };
    }

    const currencyKey: 'gold' | 'ruby' = isRuby ? 'ruby' : 'gold';

    // If target is current user
    let updatedProfile: ProfileData | undefined;
    if (targetUsername.toLowerCase() === currentUser.username.toLowerCase()) {
      updatedProfile = {
        ...currentUser,
        wallet: {
          ...wallet,
          [currencyKey]: wallet[currencyKey] + amount,
        },
      };
    }

    // Update in persistent stored accounts
    try {
      const rawAccounts = localStorage.getItem('chatcloud_users');
      if (rawAccounts) {
        const accounts: Record<string, ProfileData> = JSON.parse(rawAccounts);
        const lowerTarget = targetUsername.toLowerCase();
        if (accounts[lowerTarget]) {
          const userObj = accounts[lowerTarget];
          const userWallet = userObj.wallet || { ruby: 5, gold: 1000 };
          const updatedTargetObj = {
            ...userObj,
            wallet: {
              ...userWallet,
              [currencyKey]: (userWallet[currencyKey] || 0) + amount,
            },
          };
          accounts[lowerTarget] = updatedTargetObj;
          localStorage.setItem('chatcloud_users', JSON.stringify(accounts));
          saveUserToFirestore(updatedTargetObj).catch(() => {});
        }
      }
    } catch {}

    return {
      isCommand: true,
      updatedProfile,
      privateFeedback: {
        type: 'success',
        message: `Gave ${amount.toLocaleString()} ${isRuby ? 'Rubies' : 'Gold'} to ${targetUsername}!`,
      },
    };
  }

  // 3. /RIG (DEV ONLY)
  // Usage: /rig <username>
  if (command === 'rig') {
    if (!isDev) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Only Developers can use /rig.',
        },
      };
    }

    const targetUsername = args[0];
    if (!targetUsername) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Usage: /rig <username>',
        },
      };
    }

    setRiggedStatus(targetUsername, true);

    return {
      isCommand: true,
      privateFeedback: {
        type: 'success',
        message: `${targetUsername} has been rigged with x50 luck!`,
      },
    };
  }

  // 4. /UNRIG (DEV ONLY)
  // Usage: /unrig <username>
  if (command === 'unrig') {
    if (!isDev) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Only Developers can use /unrig.',
        },
      };
    }

    const targetUsername = args[0];
    if (!targetUsername) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Usage: /unrig <username>',
        },
      };
    }

    setRiggedStatus(targetUsername, false);

    return {
      isCommand: true,
      privateFeedback: {
        type: 'info',
        message: `${targetUsername} is no longer rigged.`,
      },
    };
  }

  // ==========================================
  // STANDARD USER COMMANDS
  // ==========================================

  // 5. /DAILY COMMAND (Private, does NOT show in public chat)
  if (command === 'daily') {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const lastClaim = currentUser.lastDailyClaim || 0;
    const timeSinceLastClaim = Date.now() - lastClaim;

    if (timeSinceLastClaim < ONE_DAY_MS) {
      const remainingMs = ONE_DAY_MS - timeSinceLastClaim;
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

      return {
        isCommand: true,
        privateFeedback: {
          type: 'info',
          message: `Daily reward already claimed! Next claim available in ${remainingHours}h ${remainingMinutes}m.`,
        },
      };
    }

    const DAILY_GOLD = 1000;
    const DAILY_RUBY = 5;

    const updatedProfile: ProfileData = {
      ...currentUser,
      wallet: {
        gold: wallet.gold + DAILY_GOLD,
        ruby: wallet.ruby + DAILY_RUBY,
      },
      lastDailyClaim: Date.now(),
    };

    return {
      isCommand: true,
      privateFeedback: {
        type: 'success',
        message: `Claimed your daily reward: +${DAILY_GOLD.toLocaleString()} Gold and +${DAILY_RUBY} Rubies!`,
      },
      updatedProfile,
    };
  }

  const isRigged = isUserRigged(currentUser.username);

  // 6. /DICE COMMAND
  if (command === 'dice') {
    const rawCurrency = args[0]?.toLowerCase();
    const rawAmount = args[1]?.toLowerCase();

    if (!rawCurrency || !rawAmount) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Usage: /dice <gold|rubies> <amount> (e.g. /dice gold 100)',
        },
      };
    }

    const isRuby = rawCurrency === 'ruby' || rawCurrency === 'rubies';
    const isGold = rawCurrency === 'gold';

    if (!isRuby && !isGold) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Invalid currency. Use "gold" or "rubies". Example: /dice gold 100',
        },
      };
    }

    const currencyKey: 'gold' | 'ruby' = isRuby ? 'ruby' : 'gold';
    const currentBalance = wallet[currencyKey];

    let betAmount: number;
    if (rawAmount === 'all' || rawAmount === 'max') {
      betAmount = currentBalance;
    } else {
      betAmount = parseInt(rawAmount, 10);
    }

    if (isNaN(betAmount) || betAmount <= 0) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Please specify a valid bet amount greater than 0.',
        },
      };
    }

    if (betAmount > currentBalance) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: `Insufficient ${isRuby ? 'Rubies' : 'Gold'}! Your balance: ${currentBalance.toLocaleString()}`,
        },
      };
    }

    // Roll logic (if rigged -> guaranteed win with x50 luck)
    let roll: number;
    let won = false;
    let multiplier = 0;

    if (isRigged) {
      roll = 100;
      won = true;
      multiplier = 50; // x50 luck!
    } else {
      roll = Math.floor(Math.random() * 100) + 1;
      if (roll >= 50) {
        won = true;
        if (roll === 100) {
          multiplier = 100; // Jackpot
        } else if (roll >= 98) {
          multiplier = 25;
        } else if (roll >= 94) {
          multiplier = 10;
        } else if (roll >= 86) {
          multiplier = 5;
        } else if (roll >= 74) {
          multiplier = 3;
        } else if (roll >= 62) {
          multiplier = 2;
        } else {
          multiplier = 1.5;
        }
      }
    }

    const payoutAmount = won ? Math.floor(betAmount * multiplier) : 0;
    const netChange = won ? payoutAmount - betAmount : -betAmount;
    const newBalance = Math.max(0, currentBalance + netChange);

    const updatedProfile: ProfileData = {
      ...currentUser,
      wallet: {
        ...wallet,
        [currencyKey]: newBalance,
      },
    };

    const gamblePayload: GambleResultPayload = {
      command: 'dice',
      username: currentUser.username,
      userAvatar: currentUser.profilePicture,
      currency: currencyKey,
      betAmount,
      multiplier,
      rollNumber: roll,
      won,
      payoutAmount: won ? payoutAmount : betAmount,
    };

    const publicMessage: ChatMessage = {
      id: `bot-dice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: 'system',
      senderName: SYSTEM_BOT.name,
      senderHandle: SYSTEM_BOT.handle,
      senderAvatar: SYSTEM_BOT.avatar,
      isSystemBot: true,
      content: `${currentUser.username} rolled the dice!`,
      timestamp: Date.now(),
      formattedTime,
      gamblePayload,
    };

    return {
      isCommand: true,
      publicMessage,
      updatedProfile,
    };
  }

  // 7. /ALLIN COMMAND
  if (command === 'allin' || command === 'all-in') {
    const rawCurrency = args[0]?.toLowerCase();

    if (!rawCurrency) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Usage: /allin <gold|rubies> (e.g. /allin gold)',
        },
      };
    }

    const isRuby = rawCurrency === 'ruby' || rawCurrency === 'rubies';
    const isGold = rawCurrency === 'gold';

    if (!isRuby && !isGold) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Invalid currency. Use "gold" or "rubies". Example: /allin gold',
        },
      };
    }

    const currencyKey: 'gold' | 'ruby' = isRuby ? 'ruby' : 'gold';
    const currentBalance = wallet[currencyKey];

    if (currentBalance <= 0) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: `You don't have any ${isRuby ? 'Rubies' : 'Gold'} to go all in with!`,
        },
      };
    }

    const betAmount = currentBalance;
    let roll: number;
    let won = false;
    let multiplier = 0;

    if (isRigged) {
      roll = 100;
      won = true;
      multiplier = 50; // x50 luck!
    } else {
      roll = Math.floor(Math.random() * 100) + 1;
      if (roll >= 50) {
        won = true;
        if (roll === 100) {
          multiplier = 100;
        } else if (roll >= 97) {
          multiplier = 20;
        } else if (roll >= 92) {
          multiplier = 8;
        } else if (roll >= 82) {
          multiplier = 4;
        } else if (roll >= 68) {
          multiplier = 2.5;
        } else {
          multiplier = 2;
        }
      }
    }

    const payoutAmount = won ? Math.floor(betAmount * multiplier) : 0;
    const netChange = won ? payoutAmount - betAmount : -betAmount;
    const newBalance = Math.max(0, currentBalance + netChange);

    const updatedProfile: ProfileData = {
      ...currentUser,
      wallet: {
        ...wallet,
        [currencyKey]: newBalance,
      },
    };

    const gamblePayload: GambleResultPayload = {
      command: 'allin',
      username: currentUser.username,
      userAvatar: currentUser.profilePicture,
      currency: currencyKey,
      betAmount,
      multiplier,
      rollNumber: roll,
      won,
      payoutAmount: won ? payoutAmount : betAmount,
    };

    const publicMessage: ChatMessage = {
      id: `bot-allin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: 'system',
      senderName: SYSTEM_BOT.name,
      senderHandle: SYSTEM_BOT.handle,
      senderAvatar: SYSTEM_BOT.avatar,
      isSystemBot: true,
      content: `${currentUser.username} went ALL IN!`,
      timestamp: Date.now(),
      formattedTime,
      gamblePayload,
    };

    return {
      isCommand: true,
      publicMessage,
      updatedProfile,
    };
  }

  // 8. /COINFLIP COMMAND
  if (command === 'coinflip' || command === 'cf') {
    const rawCurrency = args[0]?.toLowerCase();
    const rawAmount = args[1]?.toLowerCase();
    const rawChoice = args[2]?.toLowerCase() || 'heads';

    if (!rawCurrency || !rawAmount) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Usage: /coinflip <gold|rubies> <amount> [heads|tails]',
        },
      };
    }

    const isRuby = rawCurrency === 'ruby' || rawCurrency === 'rubies';
    const isGold = rawCurrency === 'gold';

    if (!isRuby && !isGold) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Invalid currency. Use "gold" or "rubies".',
        },
      };
    }

    const currencyKey: 'gold' | 'ruby' = isRuby ? 'ruby' : 'gold';
    const currentBalance = wallet[currencyKey];

    let betAmount: number;
    if (rawAmount === 'all' || rawAmount === 'max') {
      betAmount = currentBalance;
    } else {
      betAmount = parseInt(rawAmount, 10);
    }

    if (isNaN(betAmount) || betAmount <= 0) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: 'Please specify a valid bet amount greater than 0.',
        },
      };
    }

    if (betAmount > currentBalance) {
      return {
        isCommand: true,
        privateFeedback: {
          type: 'error',
          message: `Insufficient ${isRuby ? 'Rubies' : 'Gold'}! Your balance: ${currentBalance.toLocaleString()}`,
        },
      };
    }

    const userGuessIsHeads = !rawChoice.startsWith('t');
    const won = isRigged ? true : (userGuessIsHeads === (Math.random() < 0.5));
    const multiplier = won ? 2 : 0;

    const payoutAmount = won ? betAmount * 2 : 0;
    const netChange = won ? betAmount : -betAmount;
    const newBalance = Math.max(0, currentBalance + netChange);

    const updatedProfile: ProfileData = {
      ...currentUser,
      wallet: {
        ...wallet,
        [currencyKey]: newBalance,
      },
    };

    const gamblePayload: GambleResultPayload = {
      command: 'coinflip',
      username: currentUser.username,
      userAvatar: currentUser.profilePicture,
      currency: currencyKey,
      betAmount,
      multiplier,
      won,
      payoutAmount: won ? payoutAmount : betAmount,
    };

    const publicMessage: ChatMessage = {
      id: `bot-cf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: 'system',
      senderName: SYSTEM_BOT.name,
      senderHandle: SYSTEM_BOT.handle,
      senderAvatar: SYSTEM_BOT.avatar,
      isSystemBot: true,
      content: `${currentUser.username} flipped a coin (${userGuessIsHeads ? 'Heads' : 'Tails'})!`,
      timestamp: Date.now(),
      formattedTime,
      gamblePayload,
    };

    return {
      isCommand: true,
      publicMessage,
      updatedProfile,
    };
  }

  // 9. /HELP COMMAND
  if (command === 'help' || command === 'commands') {
    const baseCommands = '/dice <gold|rubies> <amount> · /allin <gold|rubies> · /coinflip <gold|rubies> <amount> · /daily';
    const devCommands = ' | DEV: /give <gold|rubies> <user> <amount> · /rig <user> · /unrig <user> · /clear';

    return {
      isCommand: true,
      privateFeedback: {
        type: 'info',
        message: isDev ? baseCommands + devCommands : baseCommands,
      },
    };
  }

  // Unknown command
  return {
    isCommand: true,
    privateFeedback: {
      type: 'error',
      message: `Unknown command "/${command}". Type /help to view available commands.`,
    },
  };
}
