// 道具配置
const items = {
    '蛋包饭': { id: 1, name: '蛋包饭', action: 3, favor: 0, description: '恢复3行动点' },
    '咖啡': { id: 2, name: '咖啡', action: 2, favor: 0, description: '恢复2行动点' }
};

// 角色属性配置
const characterAttributes = {
    '水上': { type: 'A', action: 3, maxCards: 4, initialFavor: 50 },
    '川濑': { type: 'A', action: 3, maxCards: 4, initialFavor: 50 },
    '花泽': { type: 'A', action: 4, maxCards: 4, initialFavor: 50 },
    '博士': { type: 'A', action: 3, maxCards: 5, initialFavor: 30 },
    '薰': { type: 'B', action: 5, maxCards: 2, initialFavor: 0 }
};

// 游戏状态
let gameState = {
    players: [
        { type: 'A', role: '水上', action: 3, maxCards: 4, cards: 0, items: [], favor: 50, status: 'alive' },
        { type: 'A', role: '水上', action: 3, maxCards: 4, cards: 0, items: [], favor: 50, status: 'alive' },
        { type: 'A', role: '水上', action: 3, maxCards: 4, cards: 0, items: [], favor: 50, status: 'alive' }
    ],
    currentPlayer: 0,
    tokenPosition: 0,
    round: 1,
    gameStarted: false,
    itemPool: ['蛋包饭', '蛋包饭', '咖啡', '咖啡', '咖啡'] // 蛋包饭2个，咖啡3个
};

// 地图格子配置
const gridConfig = [
    // 1. 梅钵堂
    {
        name: '梅钵堂',
        id: 1,
        isSpecial: true,
        types: ['start', 'favor'],
        favorEffect: { type: 'all', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 2. 普通格子
    {
        name: '普通格子',
        id: 2,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 3. 普通格子
    {
        name: '普通格子',
        id: 3,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 4. 市营电车站
    {
        name: '市营电车站',
        id: 4,
        isSpecial: true,
        types: ['cards'],
        favorEffect: null,
        isStagnant: false,
        道具Effect: { type: 'add', value: 1 }
    },
    // 5. 普通格子
    {
        name: '普通格子',
        id: 5,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 6. 机械汤
    {
        name: '机械汤',
        id: 6,
        isSpecial: true,
        types: ['cards', 'stagnant'],
        favorEffect: null,
        isStagnant: true,
        道具Effect: { type: 'add', value: 1 }
    },
    // 7. 普通格子
    {
        name: '普通格子',
        id: 7,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 8. 大泉家
    {
        name: '大泉家',
        id: 8,
        isSpecial: true,
        types: ['favor'],
        favorEffect: { type: 'role', role: '水上', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 9. 大泉家
    {
        name: '大泉家',
        id: 9,
        isSpecial: true,
        types: ['favor'],
        favorEffect: { type: 'role', role: '水上', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 10. 普通格子
    {
        name: '普通格子',
        id: 10,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 11. 水道桥
    {
        name: '水道桥',
        id: 11,
        isSpecial: true,
        types: ['cards'],
        favorEffect: null,
        isStagnant: false,
        道具Effect: { type: 'remove', value: 1 }
    },
    // 12. 市营电车站
    {
        name: '市营电车站',
        id: 12,
        isSpecial: true,
        types: ['cards'],
        favorEffect: null,
        isStagnant: false,
        道具Effect: { type: 'add', value: 1 }
    },
    // 13. 普通格子
    {
        name: '普通格子',
        id: 13,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 14. 普通格子
    {
        name: '普通格子',
        id: 14,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 15. 咖啡厅
    {
        name: '咖啡厅',
        id: 15,
        isSpecial: true,
        types: ['cards'],
        favorEffect: null,
        isStagnant: false,
        道具Effect: { type: 'add', value: 1 }
    },
    // 16. 普通格子
    {
        name: '普通格子',
        id: 16,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 17. 普通格子
    {
        name: '普通格子',
        id: 17,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 18. 池田宅
    {
        name: '池田宅',
        id: 18,
        isSpecial: true,
        types: ['favor'],
        favorEffect: { type: 'role', role: '川濑', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 19. 池田宅
    {
        name: '池田宅',
        id: 19,
        isSpecial: true,
        types: ['favor'],
        favorEffect: { type: 'role', role: '川濑', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 20. 池田宅
    {
        name: '池田宅',
        id: 20,
        isSpecial: true,
        types: ['favor'],
        favorEffect: { type: 'role', role: '川濑', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 21. 水洼
    {
        name: '水洼',
        id: 21,
        isSpecial: true,
        types: ['cards'],
        favorEffect: null,
        isStagnant: false,
        道具Effect: { type: 'add', value: 1 }
    },
    // 22. 普通格子
    {
        name: '普通格子',
        id: 22,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 23. 普通格子
    {
        name: '普通格子',
        id: 23,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 24. 普通格子
    {
        name: '普通格子',
        id: 24,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 25. 电影院
    {
        name: '电影院',
        id: 25,
        isSpecial: true,
        types: ['cards'],
        favorEffect: null,
        isStagnant: false,
        道具Effect: { type: 'add', value: 1 }
    },
    // 26. 普通格子
    {
        name: '普通格子',
        id: 26,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 27. 十二阶
    {
        name: '十二阶',
        id: 27,
        isSpecial: true,
        types: ['favor'],
        favorEffect: { type: 'player', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 28. 普通格子
    {
        name: '普通格子',
        id: 28,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 29. 水洼
    {
        name: '水洼',
        id: 29,
        isSpecial: true,
        types: ['cards'],
        favorEffect: null,
        isStagnant: false,
        道具Effect: { type: 'add', value: 1 }
    },
    // 30. 市营电车站
    {
        name: '市营电车站',
        id: 30,
        isSpecial: true,
        types: ['cards'],
        favorEffect: null,
        isStagnant: false,
        道具Effect: { type: 'add', value: 1 }
    },
    // 31. 帝国大学
    {
        name: '帝国大学',
        id: 31,
        isSpecial: true,
        types: ['favor'],
        favorEffect: { type: 'player', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 32. 帝国大学
    {
        name: '帝国大学',
        id: 32,
        isSpecial: true,
        types: ['favor'],
        favorEffect: { type: 'player', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 33. 帝国大学
    {
        name: '帝国大学',
        id: 33,
        isSpecial: true,
        types: ['favor'],
        favorEffect: { type: 'player', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 34. 帝国大学
    {
        name: '帝国大学',
        id: 34,
        isSpecial: true,
        types: ['favor'],
        favorEffect: { type: 'player', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 35. 帝国大学
    {
        name: '帝国大学',
        id: 35,
        isSpecial: true,
        types: ['favor'],
        favorEffect: { type: 'player', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 36. 帝国大学
    {
        name: '帝国大学',
        id: 36,
        isSpecial: true,
        types: ['favor'],
        favorEffect: { type: 'player', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 37. 普通格子
    {
        name: '普通格子',
        id: 37,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 38. 市营电车站
    {
        name: '市营电车站',
        id: 38,
        isSpecial: true,
        types: ['cards'],
        favorEffect: null,
        isStagnant: false,
        道具Effect: { type: 'add', value: 1 }
    },
    // 39. 花泽家
    {
        name: '花泽家',
        id: 39,
        isSpecial: true,
        types: ['favor'],
        favorEffect: { type: 'role', role: '花泽', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 40. 普通格子
    {
        name: '普通格子',
        id: 40,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 41. 冰川宅
    {
        name: '冰川宅',
        id: 41,
        isSpecial: true,
        types: ['favor'],
        favorEffect: { type: 'role', role: '博士', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 42. 冰川宅
    {
        name: '冰川宅',
        id: 42,
        isSpecial: true,
        types: ['favor'],
        favorEffect: { type: 'role', role: '博士', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 43. 冰川宅
    {
        name: '冰川宅',
        id: 43,
        isSpecial: true,
        types: ['favor'],
        favorEffect: { type: 'role', role: '博士', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 44. 冰川宅
    {
        name: '冰川宅',
        id: 44,
        isSpecial: true,
        types: ['favor'],
        favorEffect: { type: 'role', role: '博士', value: 10 },
        isStagnant: false,
        道具Effect: null
    },
    // 45. 水洼
    {
        name: '水洼',
        id: 45,
        isSpecial: true,
        types: ['cards'],
        favorEffect: null,
        isStagnant: false,
        道具Effect: { type: 'add', value: 1 }
    },
    // 46. 吾妻桥
    {
        name: '吾妻桥',
        id: 46,
        isSpecial: true,
        types: ['cards'],
        favorEffect: null,
        isStagnant: false,
        道具Effect: { type: 'add', value: 1 }
    },
    // 47. 普通格子
    {
        name: '普通格子',
        id: 47,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 48. 普通格子
    {
        name: '普通格子',
        id: 48,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 49. 普通格子
    {
        name: '普通格子',
        id: 49,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 50. 普通格子
    {
        name: '普通格子',
        id: 50,
        isSpecial: false,
        types: [],
        favorEffect: null,
        isStagnant: false,
        道具Effect: null
    },
    // 51. 三千堂
    {
        name: '三千堂',
        id: 51,
        isSpecial: true,
        types: ['stagnant'],
        favorEffect: null,
        isStagnant: true,
        道具Effect: null
    },
    // 52. 水洼
    {
        name: '水洼',
        id: 52,
        isSpecial: true,
        types: ['cards'],
        favorEffect: null,
        isStagnant: false,
        道具Effect: { type: 'add', value: 1 }
    }
];

// DOM元素
const elements = {
    startGame: document.getElementById('start-game'),
    gameSetup: document.querySelector('.game-setup'),
    gameBoard: document.querySelector('.game-board'),
    rollDice: document.getElementById('roll-dice'),
    resetGame: document.getElementById('reset-game'),
    diceResult: document.getElementById('dice-result'),
    currentPlayerDisplay: document.getElementById('current-player'),
    roundCount: document.getElementById('round-count'),
    gameMessage: document.getElementById('game-message'),
    token: document.getElementById('token'),
    logContent: document.getElementById('log-content'),
    player1Type: document.getElementById('player1-type'),
    player2Type: document.getElementById('player2-type'),
    player3Type: document.getElementById('player3-type'),
    player1Role: document.getElementById('player1-role'),
    player2Role: document.getElementById('player2-role'),
    player3Role: document.getElementById('player3-role'),
    player1TypeDisplay: document.getElementById('player1-type-display'),
    player2TypeDisplay: document.getElementById('player2-type-display'),
    player3TypeDisplay: document.getElementById('player3-type-display'),
    player1RoleDisplay: document.getElementById('player1-role-display'),
    player2RoleDisplay: document.getElementById('player2-role-display'),
    player3RoleDisplay: document.getElementById('player3-role-display'),
    player1Action: document.getElementById('player1-action'),
    player2Action: document.getElementById('player2-action'),
    player3Action: document.getElementById('player3-action'),
    player1Cards: document.getElementById('player1-cards'),
    player2Cards: document.getElementById('player2-cards'),
    player3Cards: document.getElementById('player3-cards'),
    player1Favor: document.getElementById('player1-favor'),
    player2Favor: document.getElementById('player2-favor'),
    player3Favor: document.getElementById('player3-favor'),
    player1Status: document.getElementById('player1-status'),
    player2Status: document.getElementById('player2-status'),
    player3Status: document.getElementById('player3-status')
};

// 初始化游戏
function initGame() {
    // 获取玩家角色设置
    const player1Role = elements.player1Role.value;
    const player2Role = elements.player2Role.value;
    const player3Role = elements.player3Role.value;
    
    // 设置玩家属性
    gameState.players[0] = {
        type: characterAttributes[player1Role].type,
        role: player1Role,
        action: characterAttributes[player1Role].action,
        maxCards: characterAttributes[player1Role].maxCards,
        cards: 0,
        items: [],
        favor: characterAttributes[player1Role].initialFavor,
        status: 'alive'
    };
    
    gameState.players[1] = {
        type: characterAttributes[player2Role].type,
        role: player2Role,
        action: characterAttributes[player2Role].action,
        maxCards: characterAttributes[player2Role].maxCards,
        cards: 0,
        items: [],
        favor: characterAttributes[player2Role].initialFavor,
        status: 'alive'
    };
    
    gameState.players[2] = {
        type: characterAttributes[player3Role].type,
        role: player3Role,
        action: characterAttributes[player3Role].action,
        maxCards: characterAttributes[player3Role].maxCards,
        cards: 0,
        items: [],
        favor: characterAttributes[player3Role].initialFavor,
        status: 'alive'
    };
    
    // 重置游戏状态
    gameState.currentPlayer = 0;
    gameState.tokenPosition = 0;
    gameState.lastTokenPosition = -1;
    gameState.gameStarted = true;
    
    // 更新UI
    updateUI();
    
    // 显示游戏界面，隐藏设置界面
    elements.gameSetup.style.display = 'none';
    elements.gameBoard.style.display = 'block';
    
    // 显示游戏开始消息
    elements.gameMessage.textContent = '游戏开始！玩家1先开始掷骰子。';
}

// 更新道具显示
function updateItemsDisplay() {
    for (let i = 0; i < 3; i++) {
        const player = gameState.players[i];
        const itemsContainer = document.getElementById(`player${i+1}-items`);
        itemsContainer.innerHTML = '';
        
        player.items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item';
            itemElement.textContent = item.name;
            itemElement.title = item.description;
            itemElement.dataset.playerIndex = i;
            itemElement.dataset.itemIndex = index;
            
            // 只有当前玩家可以使用道具
            if (i === gameState.currentPlayer && player.status === 'alive') {
                itemElement.addEventListener('click', () => useItem(i, index));
            } else {
                itemElement.classList.add('used');
            }
            
            itemsContainer.appendChild(itemElement);
        });
    }
}

// 使用道具
function useItem(playerIndex, itemIndex) {
    const player = gameState.players[playerIndex];
    const item = player.items[itemIndex];
    
    if (item && player.cards > 0) {
        // 恢复行动点
        player.action += item.action;
        
        // 增加好感度（如果有）
        if (item.favor > 0) {
            player.favor += item.favor;
        }
        
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);
        
        // 显示消息
        elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了${item.name}，恢复了${item.action}点行动点！`;
        logEvent(`玩家${playerIndex + 1}使用了${item.name}，恢复了${item.action}点行动点`);
        
        // 更新UI
        updateUI();
    }
}

// 更新UI
function updateUI() {
    // 更新当前玩家显示
    elements.currentPlayerDisplay.textContent = gameState.currentPlayer + 1;
    
    // 更新回合数显示
    elements.roundCount.textContent = gameState.round;
    
    // 更新玩家信息和当前玩家样式
    for (let i = 0; i < 3; i++) {
        const player = gameState.players[i];
        elements[`player${i+1}TypeDisplay`].textContent = player.type;
        elements[`player${i+1}RoleDisplay`].textContent = player.role;
        elements[`player${i+1}Action`].textContent = player.action;
        elements[`player${i+1}Cards`].textContent = player.cards;
        elements[`player${i+1}Favor`].textContent = player.favor;
        elements[`player${i+1}Status`].textContent = player.status === 'alive' ? '存活' : '死亡';
        
        // 更新当前玩家样式
        const playerElement = document.querySelector(`.player.player${i+1}`);
        if (i === gameState.currentPlayer) {
            playerElement.classList.add('current-player');
        } else {
            playerElement.classList.remove('current-player');
        }
    }
    
    // 更新道具显示
    updateItemsDisplay();
    
    // 更新棋子位置
    updateTokenPosition();
}

// 更新棋子位置
function updateTokenPosition() {
    const grid = document.querySelector(`.grid-${gameState.tokenPosition}`);
    if (grid) {
        const rect = grid.getBoundingClientRect();
        const mapRect = document.querySelector('.map').getBoundingClientRect();
        
        elements.token.style.top = `${rect.top - mapRect.top + 15}px`;
        elements.token.style.left = `${rect.left - mapRect.left + 15}px`;
    }
}

// 掷骰子
function rollDice() {
    if (!gameState.gameStarted) return;
    
    // 禁用掷骰子按钮
    elements.rollDice.disabled = true;
    
    // 生成随机骰子结果（1-6）
    const diceValue = Math.floor(Math.random() * 6) + 1;
    elements.diceResult.textContent = `骰子结果: ${diceValue}`;
    
    // 移动棋子
    setTimeout(() => {
        moveToken(diceValue);
    }, 500);
}

// 记录日志
function logEvent(message) {
    const logEntry = document.createElement('p');
    logEntry.textContent = message;
    elements.logContent.appendChild(logEntry);
    elements.logContent.scrollTop = elements.logContent.scrollHeight;
}

// 移动棋子
function moveToken(steps) {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const startPosition = gameState.tokenPosition;
    const startGrid = gridConfig[startPosition];
    
    // 检查是否触发停滞效果
    let canMove = true;
    let isStagnant = false;
    if (gameState.lastTokenPosition !== -1) {
        const lastGrid = gridConfig[gameState.lastTokenPosition];
        if (lastGrid.isStagnant) {
            elements.gameMessage.textContent = `棋子停留在停滞格子上，无法移动！`;
            canMove = false;
            isStagnant = true;
        }
    }
    
    // 计算新位置
    if (canMove) {
        gameState.tokenPosition = (gameState.tokenPosition + steps) % 52;
        // 更新棋子位置
        updateTokenPosition();
        
        const endPosition = gameState.tokenPosition;
        const endGrid = gridConfig[endPosition];
        
        // 记录移动日志
        logEvent(`玩家${gameState.currentPlayer + 1}(${currentPlayer.role})掷出${steps}点，从${startGrid.id}.${startGrid.name}移动到${endGrid.id}.${endGrid.name}`);
    } else {
        // 记录停滞日志
        logEvent(`玩家${gameState.currentPlayer + 1}(${currentPlayer.role})掷出${steps}点，但因停滞效果无法移动`);
    }
    
    // 处理格子功能
    setTimeout(() => {
        handleGridFunction(isStagnant);
    }, 500);
}

// 处理格子功能
function handleGridFunction(isStagnant) {
    const currentGrid = gridConfig[gameState.tokenPosition];
    const currentPlayer = gameState.players[gameState.currentPlayer];
    
    // 处理好感度效果
    if (currentGrid.favorEffect) {
        const favorEffect = currentGrid.favorEffect;
        if (favorEffect.type === 'player') {
            // 掷出此骰子的玩家好感度+10
            if (currentPlayer.type === 'A') {
                currentPlayer.favor += favorEffect.value;
                elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}获得了${favorEffect.value}点好感度！`;
                logEvent(`触发效果：玩家${gameState.currentPlayer + 1}获得了${favorEffect.value}点好感度`);
            } else {
                elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}（B类型）无法获得好感度！`;
                logEvent(`触发效果：玩家${gameState.currentPlayer + 1}（B类型）无法获得好感度`);
            }
        } else if (favorEffect.type === 'role') {
            // A类某种角色的所有玩家好感度+10
            let affectedPlayers = 0;
            gameState.players.forEach((player, index) => {
                if (player.type === 'A' && player.role === favorEffect.role && player.status === 'alive') {
                    player.favor += favorEffect.value;
                    affectedPlayers++;
                }
            });
            if (affectedPlayers > 0) {
                elements.gameMessage.textContent = `所有${favorEffect.role}角色获得了${favorEffect.value}点好感度！`;
                logEvent(`触发效果：所有${favorEffect.role}角色获得了${favorEffect.value}点好感度`);
            } else {
                elements.gameMessage.textContent = `没有${favorEffect.role}角色在场！`;
                logEvent(`触发效果：没有${favorEffect.role}角色在场`);
            }
        } else if (favorEffect.type === 'all') {
            // 全员好感度+10
            let affectedPlayers = 0;
            gameState.players.forEach((player, index) => {
                if (player.type === 'A' && player.status === 'alive') {
                    player.favor += favorEffect.value;
                    affectedPlayers++;
                }
            });
            if (affectedPlayers > 0) {
                elements.gameMessage.textContent = `所有A类型角色获得了${favorEffect.value}点好感度！`;
                logEvent(`触发效果：所有A类型角色获得了${favorEffect.value}点好感度`);
            } else {
                elements.gameMessage.textContent = `没有A类型角色在场！`;
                logEvent(`触发效果：没有A类型角色在场`);
            }
        }
    } 
    
    // 处理道具效果
    if (currentGrid.道具Effect) {
        const 道具Effect = currentGrid.道具Effect;
        if (道具Effect.type === 'add') {
            // 计算添加后的手牌数量
            const newCardsCount = currentPlayer.cards + 道具Effect.value;
            
            // 如果手牌数量没有达到上限，增加手牌
            if (newCardsCount <= currentPlayer.maxCards) {
                // 从道具池中随机获取一个道具
                if (gameState.itemPool.length > 0) {
                    const randomIndex = Math.floor(Math.random() * gameState.itemPool.length);
                    const itemName = gameState.itemPool[randomIndex];
                    const item = items[itemName];
                    
                    // 从道具池中移除该道具
                    gameState.itemPool.splice(randomIndex, 1);
                    
                    // 添加道具到玩家的道具数组
                    currentPlayer.items.push(item);
                    currentPlayer.cards = newCardsCount;
                    
                    elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}获得了${item.name}！${item.description}`;
                    logEvent(`触发效果：玩家${gameState.currentPlayer + 1}获得了${item.name}（${item.description}）`);
                } else {
                    // 道具池为空，只增加手牌数量
                    currentPlayer.cards = newCardsCount;
                    elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}获得了${道具Effect.value}张手牌！`;
                    logEvent(`触发效果：玩家${gameState.currentPlayer + 1}获得了${道具Effect.value}张手牌`);
                }
            } else {
                elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}的手牌已达到上限！`;
                logEvent(`触发效果：玩家${gameState.currentPlayer + 1}的手牌已达到上限`);
            }
        } else if (道具Effect.type === 'remove') {
            // 计算减少后的手牌数量
            const newCardsCount = currentPlayer.cards - 道具Effect.value;
            
            // 如果手牌数量没有达到下限，减少手牌
            if (newCardsCount >= 0) {
                // 随机移除一个道具
                if (currentPlayer.items.length > 0) {
                    const randomIndex = Math.floor(Math.random() * currentPlayer.items.length);
                    const removedItem = currentPlayer.items[randomIndex];
                    currentPlayer.items.splice(randomIndex, 1);
                    currentPlayer.cards = newCardsCount;
                    
                    elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}失去了${removedItem.name}！`;
                    logEvent(`触发效果：玩家${gameState.currentPlayer + 1}失去了${removedItem.name}`);
                } else {
                    // 没有道具，只减少手牌数量
                    currentPlayer.cards = newCardsCount;
                    elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}失去了${道具Effect.value}张手牌！`;
                    logEvent(`触发效果：玩家${gameState.currentPlayer + 1}失去了${道具Effect.value}张手牌`);
                }
            } else {
                elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}没有手牌可以失去！`;
                logEvent(`触发效果：玩家${gameState.currentPlayer + 1}没有手牌可以失去`);
            }
        }
    } 
    
    // 处理起点
    if (currentGrid.types.includes('start')) {
        elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}回到了起点！`;
        logEvent(`触发效果：玩家${gameState.currentPlayer + 1}回到了起点`);
    }
    
    // 更新lastTokenPosition
    // 如果是停滞状态，不更新lastTokenPosition，这样下一个玩家就可以正常移动
    if (!isStagnant) {
        gameState.lastTokenPosition = gameState.tokenPosition;
    } else {
        // 结束停滞状态，将lastTokenPosition设置为-1
        gameState.lastTokenPosition = -1;
    }
    
    // 更新UI
    updateUI();
    
    // 检查胜利条件
    if (checkWinCondition()) {
        elements.rollDice.disabled = true;
        return;
    }
    
    // 切换到下一个玩家
    setTimeout(() => {
        nextPlayer();
    }, 1000);
}

// 检查胜利条件
function checkWinCondition() {
    // 检查A玩家是否好感度达到100
    for (let i = 0; i < 3; i++) {
        const player = gameState.players[i];
        if (player.type === 'A' && player.favor >= 100) {
            elements.gameMessage.textContent = `玩家${i + 1}（A类型）好感度达到100，游戏胜利！`;
            logEvent(`游戏胜利：玩家${i + 1}（A类型）好感度达到100`);
            return true;
        }
    }
    
    // 检查B玩家是否杀死所有A玩家
    let aliveAPlayers = 0;
    for (let i = 0; i < 3; i++) {
        const player = gameState.players[i];
        if (player.type === 'A' && player.status === 'alive') {
            aliveAPlayers++;
        }
    }
    
    if (aliveAPlayers === 0) {
        elements.gameMessage.textContent = '所有A玩家已被杀死，B玩家胜利！';
        logEvent(`游戏胜利：所有A玩家已被杀死，B玩家胜利`);
        return true;
    }
    
    return false;
}

// 切换到下一个玩家
function nextPlayer() {
    // 找到下一个存活的玩家
    let nextPlayerIndex = (gameState.currentPlayer + 1) % 3;
    while (gameState.players[nextPlayerIndex].status !== 'alive') {
        nextPlayerIndex = (nextPlayerIndex + 1) % 3;
    }
    
    // 检查是否进入新回合
    if (nextPlayerIndex === 0) {
        gameState.round++;
    }
    
    gameState.currentPlayer = nextPlayerIndex;
    elements.currentPlayerDisplay.textContent = gameState.currentPlayer + 1;
    elements.roundCount.textContent = gameState.round;
    elements.gameMessage.textContent = `轮到玩家${gameState.currentPlayer + 1}掷骰子。`;
    
    // 启用掷骰子按钮
    elements.rollDice.disabled = false;
}

// 重置游戏
function resetGame() {
    // 重置回合数
    gameState.round = 1;
    
    // 重置棋子位置
    gameState.tokenPosition = 0;
    
    // 重置当前玩家
    gameState.currentPlayer = 0;
    
    // 重置道具池
    gameState.itemPool = ['蛋包饭', '蛋包饭', '咖啡', '咖啡', '咖啡'];
    
    // 重置玩家道具
    for (let i = 0; i < 3; i++) {
        gameState.players[i].items = [];
        gameState.players[i].cards = 0;
    }
    
    // 更新UI
    updateUI();
    
    // 显示重置消息
    elements.gameMessage.textContent = '游戏已重置！玩家1开始新的回合。';
    
    // 记录重置日志
    logEvent('游戏已重置，开始新的游戏');
    
    // 启用掷骰子按钮
    elements.rollDice.disabled = false;
}

// 实现日志栏拖动功能
function initDraggableLog() {
    const logElement = document.querySelector('.game-log');
    const logHeader = document.querySelector('.game-log-header');
    
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    
    logHeader.addEventListener('mousedown', function(e) {
        isDragging = true;
        offsetX = e.clientX - logElement.getBoundingClientRect().left;
        offsetY = e.clientY - logElement.getBoundingClientRect().top;
        logElement.style.zIndex = '1000';
    });
    
    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const gameContainer = document.querySelector('.game-container');
            const containerRect = gameContainer.getBoundingClientRect();
            
            let newX = e.clientX - containerRect.left - offsetX;
            let newY = e.clientY - containerRect.top - offsetY;
            
            // 限制在容器内
            newX = Math.max(0, Math.min(newX, containerRect.width - logElement.offsetWidth));
            newY = Math.max(0, Math.min(newY, containerRect.height - logElement.offsetHeight));
            
            logElement.style.left = newX + 'px';
            logElement.style.top = newY + 'px';
        }
    });
    
    document.addEventListener('mouseup', function() {
        isDragging = false;
        logElement.style.zIndex = '100';
    });
}

// 事件监听器
elements.startGame.addEventListener('click', initGame);
elements.rollDice.addEventListener('click', rollDice);
elements.resetGame.addEventListener('click', resetGame);

// 初始化页面
window.onload = function() {
    // 初始化UI
    updateUI();
    // 初始化拖动功能
    initDraggableLog();
};