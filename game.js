// 道具配置（从CSV文件中加载）
let items = {};
let itemPool = [];

// 地图格子配置（从CSV文件中加载）
let gridConfig = [];

// 解析道具CSV数据
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const parsedItems = {};
    const newItemPool = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        const item = {
            id: parseInt(values[0]),
            name: values[1],
            favor: parseInt(values[3]),
            action: parseInt(values[5]),
            description: values[10],
            quantity: parseInt(values[9])
        };

        // 处理移动功能
        //TODO 这里不要写死，地图要做限制，只能够导入一个电影院、机械汤
        if (values[6] === '是') {
            if (values[7] === '机械汤') {
                item.targetGrid = 5; // 机械汤是第6个格子，索引为5
            } else if (values[7] === '电影院') {
                item.targetGrid = 24; // 电影院是第25个格子，索引为24
            } else if (values[7] === '可指定本回合内你希望棋子移动的步数') {
                item.type = 'custom_move';
            }
        }
        
        // 处理玉森的原稿道具
        if (values[8] === '可从除川濑外的其他角色手中强制夺走任意一张道具手牌') {
            item.type = 'steal';
        }

        parsedItems[item.name] = item;

        // 填充道具池
        for (let j = 0; j < item.quantity; j++) {
            newItemPool.push(item.name);
        }
    }

    return { items: parsedItems, itemPool: newItemPool };
}

// 解析地图CSV数据
function parseMapCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const newGridConfig = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        const grid = {
            name: values[1],
            id: parseInt(values[0]),
            isSpecial: values[2] === 'true',
            types: values[3] ? values[3].split(',') : [],
            isStagnant: values[7] === 'true',
            道具Effect: null
        };

        // 处理好感度效果
        if (values[4]) {
            grid.favorEffect = {
                type: values[4],
                value: parseInt(values[6])
            };
            if (values[5]) {
                grid.favorEffect.role = values[5];
            }
        } else {
            grid.favorEffect = null;
        }

        // 处理道具效果
        if (values[8]) {
            grid.道具Effect = {
                type: values[8],
                value: parseInt(values[9])
            };
        }

        newGridConfig.push(grid);
    }

    return newGridConfig;
}

// 加载道具CSV数据
function loadItemsFromCSV(csvText) {
    try {
        const result = parseCSV(csvText);
        items = result.items;
        itemPool = result.itemPool;

        // 更新游戏状态中的道具池
        gameState.itemPool = [...itemPool];

        // 更新道具池显示
        updateItemPoolDisplay();

        console.log('道具加载成功:', items);
        return true;
    } catch (error) {
        console.error('加载道具失败:', error);
        return false;
    }
}

// 从文件读取CSV数据
function loadItemsFromFile() {
    const fileInput = document.getElementById('item-csv');
    const file = fileInput.files[0];

    if (!file) {
        alert('请先选择道具CSV文件！');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const csvText = e.target.result;
        const success = loadItemsFromCSV(csvText);
        if (success) {
            updateItemLoadStatus('已加载');
        } else {
            alert('道具加载失败，请检查CSV文件格式！');
        }
    };
    reader.onerror = function () {
        alert('读取文件失败！');
    };
    reader.readAsText(file, 'UTF-8');
}

// 尝试自动读取道具CSV文件
async function autoLoadItemsFromCSV() {
    try {
        const response = await fetch('item.csv');
        if (!response.ok) {
            return false;
        }
        const csvText = await response.text();
        const success = loadItemsFromCSV(csvText);
        if (success) {
            updateItemLoadStatus('已加载');
            console.log('自动加载道具成功');
            return true;
        }
        return false;
    } catch (error) {
        console.log('自动加载道具失败，需要手动选择:', error);
        return false;
    }
}

// 生成地图格子
function generateMapGrid() {
    const mapContainer = document.getElementById('game-map');
    if (!mapContainer) return;
    
    // 清空现有格子
    const existingGrids = mapContainer.querySelectorAll('.grid');
    existingGrids.forEach(grid => grid.remove());
    
    // 遍历格子配置并生成格子
    gridConfig.forEach((grid, index) => {
        const gridElement = document.createElement('div');
        gridElement.className = `grid grid-${index}`;
        gridElement.textContent = `${grid.id}. ${grid.name}`;
        
        // 根据格子类型设置样式
        if (grid.types.includes('start')) {
            gridElement.classList.add('grid-start');
        } else if (grid.types.includes('favor')) {
            gridElement.classList.add('grid-favor');
        } else if (grid.types.includes('cards')) {
            gridElement.classList.add('grid-cards');
        } else if (grid.types.includes('stagnant')) {
            gridElement.classList.add('grid-stagnant');
        } else if (grid.types.includes('水坑')) {
            gridElement.classList.add('grid-water');
        }
        
        mapContainer.appendChild(gridElement);
    });
}

// 加载地图CSV数据
function loadMapFromCSV(csvText) {
    try {
        const newGridConfig = parseMapCSV(csvText);
        gridConfig = newGridConfig;
        console.log('地图加载成功:', gridConfig);
        
        // 生成地图格子
        generateMapGrid();
        
        return true;
    } catch (error) {
        console.error('加载地图失败:', error);
        return false;
    }
}

// 从文件读取地图CSV数据
function loadMapFromFile() {
    const fileInput = document.getElementById('map-csv');
    const file = fileInput.files[0];

    if (!file) {
        alert('请先选择地图CSV文件！');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const csvText = e.target.result;
        const success = loadMapFromCSV(csvText);
        if (success) {
            updateMapLoadStatus('已加载');
        } else {
            alert('地图加载失败，请检查CSV文件格式！');
        }
    };
    reader.onerror = function () {
        alert('读取文件失败！');
    };
    reader.readAsText(file, 'UTF-8');
}

// 尝试自动读取地图CSV文件
async function autoLoadMapFromCSV() {
    try {
        const response = await fetch('map.csv');
        if (!response.ok) {
            return false;
        }
        const csvText = await response.text();
        const success = loadMapFromCSV(csvText);
        if (success) {
            updateMapLoadStatus('已加载');
            console.log('自动加载地图成功');
            return true;
        }
        return false;
    } catch (error) {
        console.log('自动加载地图失败，需要手动选择:', error);
        return false;
    }
}

// 更新地图加载状态显示
function updateMapLoadStatus(status) {
    const statusElement = document.getElementById('map-load-status');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

// 更新道具加载状态显示
function updateItemLoadStatus(status) {
    const statusElement = document.getElementById('item-load-status');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

// 更新道具池显示
function updateItemPoolDisplay() {
    const itemPoolContent = document.getElementById('item-pool-content');
    if (!itemPoolContent) return;

    // 清空内容
    itemPoolContent.innerHTML = '';

    // 统计道具数量
    const itemCount = {};
    gameState.itemPool.forEach(itemName => {
        if (itemCount[itemName]) {
            itemCount[itemName]++;
        } else {
            itemCount[itemName] = 1;
        }
    });

    // 显示道具池内容
    if (Object.keys(itemCount).length === 0) {
        itemPoolContent.innerHTML = '<p style="text-align: center; color: #666;">道具池已空</p>';
        return;
    }

    // 遍历道具并显示
    Object.keys(itemCount).forEach(itemName => {
        const item = items[itemName];
        if (item) {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-pool-item';
            itemElement.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="item-info">数量: ${itemCount[itemName]}</div>
                <div class="item-info">描述: ${item.description}</div>
                ${item.favor > 0 ? `<div class="item-info">好感度: +${item.favor}</div>` : ''}
                ${item.action > 0 ? `<div class="item-info">行动点: +${item.action}</div>` : ''}
            `;
            itemPoolContent.appendChild(itemElement);
        }
    });
}

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
        { type: 'A', role: '水上', cards: 0, items: [], favor: 50, status: 'alive', action: 3 },
        { type: 'A', role: '水上', cards: 0, items: [], favor: 50, status: 'alive', action: 3 },
        { type: 'A', role: '水上', cards: 0, items: [], favor: 50, status: 'alive', action: 3 }
    ],
    currentPlayer: 0,
    tokenPosition: 0,
    round: 1,
    gameStarted: false,
    itemPool: [],
    gameWon: false,
    history: [],
    week: 1,
    reverseDirection: false
};



// DOM元素
const elements = {
    startGame: document.getElementById('start-game'),
    gameSetup: document.querySelector('.game-setup'),
    gameBoard: document.querySelector('.game-board'),
    rollDice: document.getElementById('roll-dice'),
    resetGame: document.getElementById('reset-game'),
    undoAction: document.getElementById('undo-action'),
    killPlayer: document.getElementById('kill-player'),
    drawCard: document.getElementById('draw-card'),
    diceResult: document.getElementById('dice-result'),
    currentPlayerDisplay: document.getElementById('current-player'),
    roundCount: document.getElementById('round-count'),
    weekCount: document.getElementById('week-count'),
    gameMessage: document.getElementById('game-message'),
    token: document.getElementById('token'),
    logContent: document.getElementById('log-content'),
    playerCount: document.getElementById('player-count'),
    player1Type: document.getElementById('player1-type'),
    player2Type: document.getElementById('player2-type'),
    player3Type: document.getElementById('player3-type'),
    player4Type: document.getElementById('player4-type'),
    player5Type: document.getElementById('player5-type'),
    player1Role: document.getElementById('player1-role'),
    player2Role: document.getElementById('player2-role'),
    player3Role: document.getElementById('player3-role'),
    player4Role: document.getElementById('player4-role'),
    player5Role: document.getElementById('player5-role'),
    player1TypeDisplay: document.getElementById('player1-type-display'),
    player2TypeDisplay: document.getElementById('player2-type-display'),
    player3TypeDisplay: document.getElementById('player3-type-display'),
    player4TypeDisplay: document.getElementById('player4-type-display'),
    player5TypeDisplay: document.getElementById('player5-type-display'),
    player1RoleDisplay: document.getElementById('player1-role-display'),
    player2RoleDisplay: document.getElementById('player2-role-display'),
    player3RoleDisplay: document.getElementById('player3-role-display'),
    player4RoleDisplay: document.getElementById('player4-role-display'),
    player5RoleDisplay: document.getElementById('player5-role-display'),
    player1Action: document.getElementById('player1-action'),
    player2Action: document.getElementById('player2-action'),
    player3Action: document.getElementById('player3-action'),
    player4Action: document.getElementById('player4-action'),
    player5Action: document.getElementById('player5-action'),
    player1Cards: document.getElementById('player1-cards'),
    player2Cards: document.getElementById('player2-cards'),
    player3Cards: document.getElementById('player3-cards'),
    player4Cards: document.getElementById('player4-cards'),
    player5Cards: document.getElementById('player5-cards'),
    player1Favor: document.getElementById('player1-favor'),
    player2Favor: document.getElementById('player2-favor'),
    player3Favor: document.getElementById('player3-favor'),
    player4Favor: document.getElementById('player4-favor'),
    player5Favor: document.getElementById('player5-favor'),
    player1Status: document.getElementById('player1-status'),
    player2Status: document.getElementById('player2-status'),
    player3Status: document.getElementById('player3-status'),
    player4Status: document.getElementById('player4-status'),
    player5Status: document.getElementById('player5-status')
};

// 保存游戏状态到历史记录
function saveGameState() {
    // 深拷贝游戏状态，避免引用问题
    const stateCopy = {
        players: JSON.parse(JSON.stringify(gameState.players)),
        currentPlayer: gameState.currentPlayer,
        tokenPosition: gameState.tokenPosition,
        round: gameState.round,
        gameStarted: gameState.gameStarted,
        itemPool: [...gameState.itemPool],
        gameWon: gameState.gameWon,
        week: gameState.week,
        reverseDirection: gameState.reverseDirection
    };
    gameState.history.push(stateCopy);
    // 限制历史记录长度，只保留最近10个状态
    if (gameState.history.length > 10) {
        gameState.history.shift();
    }
}

// 初始化游戏
function initGame() {
    // 检查道具是否已加载
    if (Object.keys(items).length === 0) {
        alert('请先加载道具CSV文件！');
        return;
    }
    
    // 检查地图是否已加载
    if (gridConfig.length === 0) {
        alert('请先加载地图CSV文件！');
        return;
    }
    
    // 清空历史记录
    gameState.history = [];

    // 获取玩家数量
    const playerCount = parseInt(document.getElementById('player-count').value) || 3;

    // 获取玩家角色设置
    const playerRoles = [];
    for (let i = 1; i <= playerCount; i++) {
        const role = document.getElementById(`player${i}-role`).value;
        playerRoles.push(role);
    }

    // 设置玩家属性
    gameState.players = [];
    for (let i = 0; i < playerCount; i++) {
        const role = playerRoles[i];
        gameState.players.push({
            type: characterAttributes[role].type,
            role: role,
            cards: 0,
            items: [],
            favor: characterAttributes[role].initialFavor,
            status: 'alive',
            action: characterAttributes[role].action
        });
    }

    // 重置游戏状态
    gameState.currentPlayer = 0;
    gameState.tokenPosition = 0;
    gameState.gameStarted = true;
    gameState.gameWon = false;
    gameState.week = 1;
    gameState.reverseDirection = false;
    gameState.stagnantTurn = -1;
    
    // 确保棋子位置正确更新
    updateTokenPosition();
    
    // 生成地图格子
    generateMapGrid();

    // 重新初始化道具池
    gameState.itemPool = [...itemPool];

    // 为所有玩家设置初始行动点
    for (let i = 0; i < playerCount; i++) {
        const player = gameState.players[i];
        player.action = characterAttributes[player.role].action;
    }

    // 游戏开始时，为所有玩家依次随机抽取能够拥有的最大道具数量的道具
    let startMessage = '游戏开始！玩家1先开始掷骰子。';
    for (let i = 0; i < playerCount; i++) {
        const player = gameState.players[i];
        const maxCards = characterAttributes[player.role].maxCards;
        
        // 为玩家抽取最大数量的道具
        while (player.cards < maxCards && gameState.itemPool.length > 0) {
            const randomIndex = Math.floor(Math.random() * gameState.itemPool.length);
            const itemName = gameState.itemPool[randomIndex];
            const item = items[itemName];

            // 从道具池中移除该道具
            gameState.itemPool.splice(randomIndex, 1);

            // 添加道具到玩家的道具数组
            player.items.push(item);
            player.cards++;

            logEvent(`玩家${i + 1}（${player.role}）游戏开始，获得道具${item.name}`);
        }
    }

    // 更新道具池显示
    updateItemPoolDisplay();

    // 更新UI
    updateUI();

    // 显示游戏界面，隐藏设置界面
    elements.gameSetup.style.display = 'none';
    elements.gameBoard.style.display = 'block';

    // 显示游戏开始消息
    elements.gameMessage.textContent = startMessage;
}

// 更新道具显示
function updateItemsDisplay() {
    const playerCount = gameState.players.length;
    for (let i = 0; i < playerCount; i++) {
        const player = gameState.players[i];
        const itemsContainer = document.getElementById(`player${i + 1}-items`);
        itemsContainer.innerHTML = '';

        player.items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item';
            itemElement.textContent = item.name;
            itemElement.title = item.description;
            itemElement.dataset.playerIndex = i;
            itemElement.dataset.itemIndex = index;

            // 只有当前玩家且存活时且游戏未胜利时可以使用道具
            if (i === gameState.currentPlayer && player.status === 'alive' && !gameState.gameWon) {
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

    if (gameState.gameWon) {
        elements.gameMessage.textContent = '游戏已胜利，无法使用道具！';
        logEvent('游戏已胜利，无法使用道具');
        return;
    }

    if (player.status !== 'alive') {
        elements.gameMessage.textContent = `玩家${playerIndex + 1}已死亡，无法使用道具！`;
        logEvent(`玩家${playerIndex + 1}已死亡，无法使用道具`);
        return;
    }

    // 检查行动点
    if (!player.action || player.action <= 0) {
        elements.gameMessage.textContent = `玩家${playerIndex + 1}行动点不足，无法使用道具！`;
        logEvent(`玩家${playerIndex + 1}行动点不足，无法使用道具`);
        return;
    }



    if (item && player.cards > 0) {
        // 保存游戏状态
        saveGameState();

        // 消耗行动点
        player.action--;
        logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具`);

        // 恢复行动点
        // 注意：这里我们直接修改player.action，因为这是临时的行动点变化
        player.action += item.action;

        // 增加好感度（如果有）
        if (item.favor > 0 && player.role !== '薰') {
            player.favor += item.favor;
        }

        // 处理移动功能
        if (item.targetGrid !== undefined) {
            const oldPosition = gameState.tokenPosition;
            const oldGrid = gridConfig[oldPosition];
            gameState.tokenPosition = item.targetGrid;
            const newGrid = gridConfig[item.targetGrid];
            updateTokenPosition();

            // 记录移动日志
            logEvent(`玩家${playerIndex + 1}使用${item.name}，从${oldGrid.id}.${oldGrid.name}移动到${newGrid.id}.${newGrid.name}`);
        } else if (item.type === 'custom_move') {
            // 处理提灯道具，自定义移动步数
            let steps = prompt('请输入希望移动的步数（1-6）:', '');

            // 验证输入
            steps = parseInt(steps);
            if (isNaN(steps) || steps < 1 || steps > 6) {
                alert('输入无效，请输入1-6之间的数字！');
                // 恢复行动点
                player.action++;
                return;
            }

            // 移动棋子
            const oldPosition = gameState.tokenPosition;
            const oldGrid = gridConfig[oldPosition];
            if (gameState.reverseDirection) {
                // 逆转方向移动
                gameState.tokenPosition = (gameState.tokenPosition - steps + 52) % 52;
            } else {
                // 正常方向移动
                gameState.tokenPosition = (gameState.tokenPosition + steps) % 52;
            }
            const newGrid = gridConfig[gameState.tokenPosition];
            updateTokenPosition();

            // 记录移动日志
            logEvent(`玩家${playerIndex + 1}使用${item.name}，从${oldGrid.id}.${oldGrid.name}移动了${steps}步到${newGrid.id}.${newGrid.name}${gameState.reverseDirection ? '（逆转方向）' : ''}`);
        } else if (item.type === 'steal') {
            // 处理玉森的原稿道具，从其他角色手中抢夺道具
            // 过滤出除川濑外的其他存活玩家
            const availablePlayers = [];
            gameState.players.forEach((targetPlayer, targetIndex) => {
                if (targetIndex !== playerIndex && targetPlayer.status === 'alive' && targetPlayer.role !== '川濑' && targetPlayer.items.length > 0) {
                    availablePlayers.push(targetIndex);
                }
            });

            if (availablePlayers.length === 0) {
                elements.gameMessage.textContent = '没有可抢夺的目标！';
                logEvent(`玩家${playerIndex + 1}（${player.role}）尝试使用${item.name}，但没有可抢夺的目标`);
                // 恢复行动点
                player.action++;
                return;
            }

            // 构建选择界面
            let stealOptions = '';
            availablePlayers.forEach(targetIndex => {
                const targetPlayer = gameState.players[targetIndex];
                stealOptions += `<h4>玩家${targetIndex + 1}（${targetPlayer.role}）的道具：</h4>`;
                targetPlayer.items.forEach((targetItem, itemIndex) => {
                    stealOptions += `<div class="steal-item" data-target-player="${targetIndex}" data-item-index="${itemIndex}">${targetItem.name} - ${targetItem.description}</div>`;
                });
            });

            // 创建弹出框
            const stealDialog = document.createElement('div');
            stealDialog.className = 'steal-dialog';
            stealDialog.innerHTML = `
                <div class="steal-dialog-content">
                    <h3>选择要抢夺的道具：</h3>
                    <div class="steal-options">${stealOptions}</div>
                    <button class="cancel-steal">取消</button>
                </div>
            `;
            document.body.appendChild(stealDialog);

            // 添加样式
            const style = document.createElement('style');
            style.textContent = `
                .steal-dialog {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                }
                .steal-dialog-content {
                    background-color: white;
                    padding: 20px;
                    border-radius: 5px;
                    width: 80%;
                    max-width: 600px;
                    max-height: 80%;
                    overflow-y: auto;
                }
                .steal-item {
                    padding: 10px;
                    border: 1px solid #ccc;
                    margin: 5px 0;
                    cursor: pointer;
                }
                .steal-item:hover {
                    background-color: #f0f0f0;
                }
                .cancel-steal {
                    margin-top: 20px;
                    padding: 10px;
                    background-color: #ccc;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
            `;
            document.head.appendChild(style);

            // 处理道具选择
            const stealItems = stealDialog.querySelectorAll('.steal-item');
            stealItems.forEach(itemElement => {
                itemElement.addEventListener('click', () => {
                    const targetPlayerIndex = parseInt(itemElement.dataset.targetPlayer);
                    const targetItemIndex = parseInt(itemElement.dataset.itemIndex);
                    
                    // 抢夺道具
                    const targetPlayer = gameState.players[targetPlayerIndex];
                    const stolenItem = targetPlayer.items[targetItemIndex];
                    
                    // 从目标玩家手中移除道具
                    targetPlayer.items.splice(targetItemIndex, 1);
                    targetPlayer.cards = Math.max(0, targetPlayer.cards - 1);
                    
                    // 添加到当前玩家手中
                    player.items.push(stolenItem);
                    player.cards++;
                    
                    // 从当前玩家的道具栏中移除玉森的原稿（一次性道具）
                    player.items.splice(itemIndex, 1);
                    player.cards = Math.max(0, player.cards - 1);
                    
                    // 记录日志
                    logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}，从玩家${targetPlayerIndex + 1}（${targetPlayer.role}）手中抢夺了${stolenItem.name}`);
                    
                    // 关闭对话框
                    document.body.removeChild(stealDialog);
                    document.head.removeChild(style);
                    
                    // 显示消息
                    elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了${item.name}，从玩家${targetPlayerIndex + 1}（${targetPlayer.role}）手中抢夺了${stolenItem.name}！`;
                    
                    // 更新UI
                    updateUI();
                    
                    // 检查行动点是否为0，如果是则自动结束行动
                    if (player.action <= 0) {
                        setTimeout(() => {
                            elements.gameMessage.textContent = `玩家${playerIndex + 1}行动点已耗尽，自动结束行动。`;
                            logEvent(`玩家${playerIndex + 1}行动点已耗尽，自动结束行动`);
                            endTurn();
                        }, 1000);
                    } else {
                        // 检查是否在停滞格子上
                        const currentGrid = gridConfig[gameState.tokenPosition];
                        if (!currentGrid.isStagnant) {
                            // 不在停滞格子上，重新启用掷骰子按钮
                            elements.rollDice.disabled = false;
                        } else {
                            // 在停滞格子上，保持掷骰子按钮禁用
                            elements.rollDice.disabled = true;
                        }
                    }
                });
            });

            // 处理取消按钮
            const cancelButton = stealDialog.querySelector('.cancel-steal');
            cancelButton.addEventListener('click', () => {
                document.body.removeChild(stealDialog);
                document.head.removeChild(style);
                // 恢复行动点
                player.action++;
            });
        }

        // 从道具列表中移除（玉森的原稿已在抢夺逻辑中处理）
        if (item.type !== 'steal') {
            player.items.splice(itemIndex, 1);
            player.cards = Math.max(0, player.cards - 1);

            // 显示消息
            let message = `玩家${playerIndex + 1}使用了${item.name}`;
            if (item.action > 0) {
                message += `，恢复了${item.action}点行动点`;
            }
            if (item.favor > 0 && player.role !== '薰') {
                message += `，增加了${item.favor}点好感度`;
            }
            if (item.targetGrid !== undefined) {
                const targetGrid = gridConfig[item.targetGrid];
                message += `，移动到${targetGrid.id}.${targetGrid.name}`;
            }
            message += '！';
            elements.gameMessage.textContent = message;
            logEvent(message);

            // 处理新位置的格子功能
            if (item.targetGrid !== undefined || item.type === 'custom_move') {
                setTimeout(() => {
                    handleGridFunction();
                }, 500);
            } else {
                // 更新UI
                updateUI();

                // 检查行动点是否为0，如果是则自动结束行动
                if (player.action <= 0) {
                    setTimeout(() => {
                        elements.gameMessage.textContent = `玩家${playerIndex + 1}行动点已耗尽，自动结束行动。`;
                        logEvent(`玩家${playerIndex + 1}行动点已耗尽，自动结束行动`);
                        endTurn();
                    }, 1000);
                } else {
                    // 检查是否在停滞格子上
                    const currentGrid = gridConfig[gameState.tokenPosition];
                    if (!currentGrid.isStagnant) {
                        // 不在停滞格子上，重新启用掷骰子按钮
                        elements.rollDice.disabled = false;
                    } else {
                        // 在停滞格子上，保持掷骰子按钮禁用
                        elements.rollDice.disabled = true;
                    }
                }
            }
        }
    }
}

// 更新UI
function updateUI() {
    // 更新当前玩家显示
    elements.currentPlayerDisplay.textContent = gameState.currentPlayer + 1;

    // 更新回合数显示
    elements.roundCount.textContent = gameState.round;
    
    // 更新周目数显示
    elements.weekCount.textContent = gameState.week;

    // 更新玩家信息和当前玩家样式
    const playerCount = gameState.players.length;
    for (let i = 0; i < playerCount; i++) {
        const player = gameState.players[i];
        elements[`player${i + 1}TypeDisplay`].textContent = player.type;
        elements[`player${i + 1}RoleDisplay`].textContent = player.role;
        // elements[`player${i + 1}Action`].textContent = player.action || characterAttributes[player.role].action;
        // 如果 action 是 undefined 或 null，则使用初始值；如果是 0 或其他数字，则直接显示该数字
        const currentAction = (player.action !== undefined && player.action !== null)
            ? player.action
            : characterAttributes[player.role].action;

        elements[`player${i + 1}Action`].textContent = currentAction;

        elements[`player${i + 1}Cards`].textContent = player.cards;
        elements[`player${i + 1}Favor`].textContent = player.favor;
        elements[`player${i + 1}Status`].textContent = player.status === 'alive' ? '存活' : '死亡';

        // 更新当前玩家样式
        const playerElement = document.querySelector(`.player.player${i + 1}`);
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
    const posIndex = gameState.tokenPosition;
    
    // 安全校验
    if (posIndex < 0 || posIndex >= gridConfig.length) {
        console.error(`棋子位置索引 ${posIndex} 越界`);
        return;
    }

    const currentGridData = gridConfig[posIndex];
    
    // 策略：优先尝试匹配索引类名 (.grid-0)，如果失败，尝试匹配 ID 类名 (.grid-1)
    // 这样可以兼容两种 HTML 生成方式
    let grid = document.querySelector(`.grid-${posIndex}`);
    
    if (!grid && currentGridData.id !== undefined) {
        // 如果索引类名没找到，尝试用 CSV 中的 ID 查找
        grid = document.querySelector(`.grid-${currentGridData.id}`);
        if (grid) {
            console.warn(`警告：使用了 ID 类名 (.grid-${currentGridData.id}) 而非索引类名。建议统一 HTML 生成逻辑使用索引。`);
        }
    }

    if (!grid) {
        console.error(`严重错误：无法在 DOM 中找到位置索引 ${posIndex} (格子: ${currentGridData.name}) 对应的元素。`);
        console.log(`请检查 HTML 中是否有 class="grid-${posIndex}" 或 class="grid-${currentGridData.id}" 的元素。`);
        elements.gameMessage.textContent = `地图错误：找不到格子 "${currentGridData.name}"`;
        return;
    }

    const mapContainer = document.querySelector('.map');
    if (!mapContainer) {
        console.error('未找到 .map 容器');
        return;
    }

    const mapRect = mapContainer.getBoundingClientRect();
    const rect = grid.getBoundingClientRect();

    // 计算相对位置
    const top = rect.top - mapRect.top + (rect.height / 2) - (elements.token.offsetHeight / 2);
    const left = rect.left - mapRect.left + (rect.width / 2) - (elements.token.offsetWidth / 2);

    elements.token.style.top = `${top}px`;
    elements.token.style.left = `${left}px`;
    elements.token.style.display = 'block';
    
    console.log(`棋子已移动到: ${currentGridData.name} (索引:${posIndex})`);
}

// 掷骰子
function rollDice() {
    if (!gameState.gameStarted) return;

    // 检查当前玩家是否存活
    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (currentPlayer.status !== 'alive') {
        elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}已死亡，无法掷骰子！`;
        logEvent(`玩家${gameState.currentPlayer + 1}已死亡，无法掷骰子`);
        return;
    }

    // 检查行动点
    if (!currentPlayer.action || currentPlayer.action <= 0) {
        elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}行动点不足，无法掷骰子！`;
        logEvent(`玩家${gameState.currentPlayer + 1}行动点不足，无法掷骰子`);
        return;
    }

    // 保存游戏状态
    saveGameState();

    // 消耗行动点
    currentPlayer.action--;
    logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）消耗1点行动点掷骰子`);

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
    if (startGrid.isStagnant && gameState.stagnantTurn === gameState.currentPlayer) {
        elements.gameMessage.textContent = `棋子停留在停滞格子上，无法移动！`;
        canMove = false;
        isStagnant = true;
    }

    // 计算新位置
    if (canMove) {
        if (gameState.reverseDirection) {
            // 逆转方向移动
            gameState.tokenPosition = (gameState.tokenPosition - steps + 52) % 52;
        } else {
            // 正常方向移动
            gameState.tokenPosition = (gameState.tokenPosition + steps) % 52;
        }
        // 更新棋子位置
        updateTokenPosition();

        const endPosition = gameState.tokenPosition;
        const endGrid = gridConfig[endPosition];

        // 记录移动日志
        logEvent(`玩家${gameState.currentPlayer + 1}(${currentPlayer.role})掷出${steps}点，从${startGrid.id}.${startGrid.name}移动到${endGrid.id}.${endGrid.name}${gameState.reverseDirection ? '（逆转方向）' : ''}`);
    } else {
        // 记录停滞日志
        logEvent(`玩家${gameState.currentPlayer + 1}(${currentPlayer.role})掷出${steps}点，但因停滞效果无法移动`);
    }

    // 处理格子功能
    setTimeout(() => {
        handleGridFunction();
    }, 500);
}

// 处理格子功能
function handleGridFunction() {
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

            // 获取角色的手牌上限
            const maxCards = characterAttributes[currentPlayer.role].maxCards;

            // 如果手牌数量没有达到上限，增加手牌
            if (newCardsCount <= maxCards) {
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

                    // 更新道具池显示
                    updateItemPoolDisplay();

                    elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}获得了${item.name}！${item.description}`;
                    logEvent(`触发效果：玩家${gameState.currentPlayer + 1}获得了${item.name}（${item.description}）`);
                } else {
                    // 道具池为空，不增加手牌数量
                    elements.gameMessage.textContent = `道具池已空，无法获得道具！`;
                    logEvent(`触发效果：道具池已空，无法获得道具`);
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
    
    // 处理停滞格子
    if (currentGrid.isStagnant) {
        elements.gameMessage.textContent = `棋子停留在停滞格子上，无法移动！`;
        logEvent(`触发效果：棋子停留在停滞格子上，无法移动`);
        // 禁用掷骰子按钮
        elements.rollDice.disabled = true;
        // 记录当前玩家的回合为停滞回合
        gameState.stagnantTurn = gameState.currentPlayer;
    }
    
    // 处理水坑
    if (currentGrid.types.includes('水坑')) {
        elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}进入了水坑！行动结束，周目+1！`;
        logEvent(`触发效果：玩家${gameState.currentPlayer + 1}进入了水坑，行动结束`);
        
        // 增加周目
        gameState.week++;
        // 切换移动方向
        gameState.reverseDirection = !gameState.reverseDirection;
        logEvent(`周目更新：第${gameState.week}周目，移动方向${gameState.reverseDirection ? '逆转' : '正常'}`);
        
        // 重置所有人的行动点为初始行动点
        // 死亡的玩家，状态改为alive，好感度重置为初始好感度
        gameState.players.forEach((player, index) => {
            // 重置行动点为初始值
            player.action = characterAttributes[player.role].action;
            
            // 如果玩家死亡，复活并重置好感度
            if (player.status !== 'alive') {
                player.status = 'alive';
                player.favor = characterAttributes[player.role].initialFavor;
                logEvent(`玩家${index + 1}（${player.role}）被复活，好感度重置为初始值`);
            }
        });
        
        // 结束行动
        setTimeout(() => {
            endTurn();
        }, 1000);
        return;
    }

    // 更新UI
    updateUI();

    // 检查胜利条件
    if (checkWinCondition()) {
        elements.rollDice.disabled = true;
        return;
    }

    // 检查行动点
    if (currentPlayer.action <= 0) {
        // 行动点为0，自动结束行动
        setTimeout(() => {
            elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}行动点已耗尽，自动结束行动。`;
            logEvent(`玩家${gameState.currentPlayer + 1}行动点已耗尽，自动结束行动`);
            endTurn();
        }, 1000);
    } else {
        // 检查是否在停滞格子上
        if (!currentGrid.isStagnant) {
            // 不在停滞格子上，重新启用掷骰子按钮
            elements.rollDice.disabled = false;
            elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}还有${currentPlayer.action}点行动点，可以继续操作。`;
        } else {
            // 在停滞格子上，保持掷骰子按钮禁用
            elements.rollDice.disabled = true;
        }
    }
}

// 检查胜利条件
function checkWinCondition() {
    const playerCount = gameState.players.length;
    // 检查A玩家是否好感度达到100
    for (let i = 0; i < playerCount; i++) {
        const player = gameState.players[i];
        if (player.type === 'A' && player.favor >= 100) {
            elements.gameMessage.textContent = `玩家${i + 1}（A类型）好感度达到100，游戏胜利！`;
            logEvent(`游戏胜利：玩家${i + 1}（A类型）好感度达到100`);
            gameState.gameWon = true;
            return true;
        }
    }

    // 检查B玩家是否杀死所有A玩家
    let aliveAPlayers = 0;
    let aliveBPlayers = 0;
    for (let i = 0; i < playerCount; i++) {
        const player = gameState.players[i];
        if (player.type === 'A' && player.status === 'alive') {
            aliveAPlayers++;
        }
        if (player.type === 'B' && player.status === 'alive') {
            aliveBPlayers++;
        }
    }

    if (aliveAPlayers === 0 && aliveBPlayers > 0) {
        elements.gameMessage.textContent = '所有A玩家已被杀死，B玩家胜利！';
        logEvent(`游戏胜利：所有A玩家已被杀死，B玩家胜利`);
        gameState.gameWon = true;
        return true;
    }

    return false;
}

// 结束行动
function endTurn() {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）结束行动`);
    nextPlayer();
}


// 切换到下一个玩家-准备阶段
function nextPlayer() {
    const playerCount = gameState.players.length;

    // 找到下一个存活的玩家
    let nextPlayerIndex = (gameState.currentPlayer + 1) % playerCount;
    while (gameState.players[nextPlayerIndex].status !== 'alive') {
        elements.gameMessage.textContent = `玩家${nextPlayerIndex + 1}已死亡，无法执行操作。`;
        logEvent(`玩家${nextPlayerIndex + 1}已死亡，无法执行操作`);
        nextPlayerIndex = (nextPlayerIndex + 1) % playerCount;
    }

    // 检查是否进入新回合
    if (nextPlayerIndex === 0) {
        gameState.round++;
    }

    gameState.currentPlayer = nextPlayerIndex;
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const maxCards = characterAttributes[currentPlayer.role].maxCards;

    // 如果游戏已胜利，直接返回
    if (gameState.gameWon) {
        elements.currentPlayerDisplay.textContent = gameState.currentPlayer + 1;
        elements.roundCount.textContent = gameState.round;
        return;
    }

    // 玩家行动开始时，从牌堆摸一张道具卡（如果手牌未达到上限）
    let itemMessage = '';
    if (currentPlayer.cards < maxCards && gameState.itemPool.length > 0) {
        const randomIndex = Math.floor(Math.random() * gameState.itemPool.length);
        const itemName = gameState.itemPool[randomIndex];
        const item = items[itemName];

        // 从道具池中移除该道具
        gameState.itemPool.splice(randomIndex, 1);

        // 添加道具到玩家的道具数组
        currentPlayer.items.push(item);
        currentPlayer.cards++;

        itemMessage = `获得道具${item.name}，`;
        logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）行动开始，获得道具${item.name}`);

        // 更新道具池显示
        updateItemPoolDisplay();
    }

    // 若当前角色行动点为零，自动回复1点
    let actionMessage = '';
    if (!currentPlayer.action || currentPlayer.action === 0) {
        currentPlayer.action = 1;
        actionMessage = '行动点自动回复1点，';
        logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）行动点为零，自动回复1点`);
    } else {
        // 确保行动点有初始值
        //当行动点为 0 时，会保持为 0 ，只有当行动点未定义时，才会设置为初始值。
        if (currentPlayer.action === undefined || currentPlayer.action === null) {
            currentPlayer.action = characterAttributes[currentPlayer.role].action;
        }
    }

    elements.currentPlayerDisplay.textContent = gameState.currentPlayer + 1;
    elements.roundCount.textContent = gameState.round;

    // 清除停滞状态
    gameState.stagnantTurn = -1;

    // 组合消息
    let message = `轮到玩家${gameState.currentPlayer + 1}行动。`;
    if (itemMessage || actionMessage) {
        message = `轮到玩家${gameState.currentPlayer + 1}行动。${itemMessage}${actionMessage}`;
    }
    elements.gameMessage.textContent = message;

    // 启用掷骰子按钮
    elements.rollDice.disabled = false;

    // 更新UI
    updateUI();
}

// 重置游戏
async function resetGame() {
    // 尝试重新加载道具
    updateItemLoadStatus('重新加载中...');
    const loaded = await autoLoadItemsFromCSV();
    if (!loaded) {
        updateItemLoadStatus('未加载，请选择文件');
    }

    // 重置游戏胜利状态
    gameState.gameWon = false;

    // 重置回合数
    gameState.round = 1;

    // 重置棋子位置
    gameState.tokenPosition = 0;

    // 重置当前玩家
    gameState.currentPlayer = 0;
    
    // 重置周目和移动方向
    gameState.week = 1;
    gameState.reverseDirection = false;

    // 重置玩家道具
    for (let i = 0; i < 3; i++) {
        gameState.players[i].items = [];
        gameState.players[i].cards = 0;
    }

    // 更新UI
    updateUI();

    // 显示重置消息
    if (Object.keys(items).length > 0) {
        elements.gameMessage.textContent = '游戏已重置！玩家1开始新的回合。';
        logEvent('游戏已重置，开始新的游戏');
    } else {
        elements.gameMessage.textContent = '游戏已重置！玩家1开始新的回合。如果需要重新加载道具，请使用"加载道具"按钮。';
        logEvent('游戏已重置，开始新的游戏');
        logEvent('如果需要重新加载道具，请使用"加载道具"按钮');
    }

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

    logHeader.addEventListener('mousedown', function (e) {
        isDragging = true;
        offsetX = e.clientX - logElement.getBoundingClientRect().left;
        offsetY = e.clientY - logElement.getBoundingClientRect().top;
        logElement.style.zIndex = '1000';
    });

    document.addEventListener('mousemove', function (e) {
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

    document.addEventListener('mouseup', function () {
        isDragging = false;
        logElement.style.zIndex = '100';
    });
}

// 随机分配角色
function randomRoles() {
    const playerCount = parseInt(document.getElementById('player-count').value) || 3;
    const roles = ['水上', '川濑', '花泽', '博士', '薰'];

    // 打乱角色顺序
    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // 分配角色给玩家
    for (let i = 1; i <= playerCount; i++) {
        const role = roles[(i - 1) % roles.length];
        const playerRoleSelect = document.getElementById(`player${i}-role`);
        const playerTypeSelect = document.getElementById(`player${i}-type`);

        if (playerRoleSelect && playerTypeSelect) {
            playerRoleSelect.value = role;
            // 根据角色类型自动设置玩家类型
            playerTypeSelect.value = characterAttributes[role].type;
        }
    }
}

// 处理玩家数量变化
function handlePlayerCountChange() {
    const playerCount = parseInt(document.getElementById('player-count').value) || 3;
    
    // 显示或隐藏玩家设置
    for (let i = 3; i <= 5; i++) {
        const playerInput = document.querySelector(`.player-input:nth-child(${i + 1})`);
        if (playerInput) {
            playerInput.style.display = i <= playerCount ? 'block' : 'none';
        }
    }
    
    // 显示或隐藏玩家信息
    for (let i = 3; i <= 5; i++) {
        const playerInfo = document.querySelector(`.player.player${i}`);
        if (playerInfo) {
            playerInfo.style.display = i <= playerCount ? 'block' : 'none';
        }
    }
}

// 撤回操作
function undoAction() {
    if (!gameState.gameStarted || gameState.history.length === 0) {
        elements.gameMessage.textContent = '没有可撤回的操作！';
        return;
    }

    // 从历史记录中获取上一个状态
    const previousState = gameState.history.pop();
    if (previousState) {
        // 恢复游戏状态
        gameState.players = previousState.players;
        gameState.currentPlayer = previousState.currentPlayer;
        gameState.tokenPosition = previousState.tokenPosition;
        gameState.round = previousState.round;
        gameState.gameStarted = previousState.gameStarted;
        gameState.itemPool = previousState.itemPool;
        gameState.gameWon = previousState.gameWon;
        gameState.week = previousState.week;
        gameState.reverseDirection = previousState.reverseDirection;

        // 更新UI
        updateUI();
        updateTokenPosition();

        // 启用掷骰子按钮
        elements.rollDice.disabled = false;

        // 显示消息
        elements.gameMessage.textContent = '已撤回上次操作！';
        logEvent(`玩家${gameState.currentPlayer + 1}（${gameState.players[gameState.currentPlayer].role}）撤回了上次操作`);
    }
}

// 杀人操作
function killPlayer() {
    if (!gameState.gameStarted) return;

    // 检查当前玩家是否存活
    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (currentPlayer.status !== 'alive') {
        elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}已死亡，无法执行杀人操作！`;
        logEvent(`玩家${gameState.currentPlayer + 1}已死亡，无法执行杀人操作`);
        return;
    }

    // 检查行动点
    if (!currentPlayer.action || currentPlayer.action < 4) {
        elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}行动点不足4点，无法执行杀人操作！`;
        logEvent(`玩家${gameState.currentPlayer + 1}行动点不足4点，无法执行杀人操作`);
        return;
    }

    // 生成可选择的玩家列表
    const availablePlayers = [];
    for (let i = 0; i < gameState.players.length; i++) {
        if (i !== gameState.currentPlayer && gameState.players[i].status === 'alive') {
            availablePlayers.push(i);
        }
    }

    if (availablePlayers.length === 0) {
        elements.gameMessage.textContent = '没有可选择的目标！';
        logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）尝试杀人，但没有可选择的目标`);
        return;
    }

    // 显示选择框
    let options = '';
    availablePlayers.forEach(index => {
        const player = gameState.players[index];
        options += `<option value="${index}">玩家${index + 1}（${player.role}）</option>`;
    });

    const selectHtml = `
        <div style="padding: 10px;">
            <p>选择要杀死的玩家：</p>
            <select id="target-player">${options}</select>
        </div>
    `;

    if (confirm(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）确定要消耗4点行动点执行杀人操作吗？`)) {
        const targetIndex = parseInt(prompt(`请选择要杀死的玩家（输入编号）：\n${availablePlayers.map(index => `${index + 1}. 玩家${index + 1}（${gameState.players[index].role}）`).join('\n')}`));
        
        if (isNaN(targetIndex) || targetIndex < 1 || targetIndex > gameState.players.length || targetIndex - 1 === gameState.currentPlayer || gameState.players[targetIndex - 1].status !== 'alive') {
            elements.gameMessage.textContent = '无效的选择！';
            return;
        }

        const targetPlayerIndex = targetIndex - 1;
        const targetPlayer = gameState.players[targetPlayerIndex];

        // 保存游戏状态
        saveGameState();

        // 消耗行动点
        currentPlayer.action -= 4;
        logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）消耗4点行动点执行杀人操作`);

        // 设置目标玩家为死亡
        targetPlayer.status = 'die';
        logEvent(`玩家${targetPlayerIndex + 1}（${targetPlayer.role}）被杀死`);

        // 更新UI
        updateUI();

        // 显示消息
        elements.gameMessage.textContent = `玩家${targetPlayerIndex + 1}（${targetPlayer.role}）已被杀死！`;

        // 检查胜利条件
        checkWinCondition();
    }
}

// 抽牌操作
function drawCard() {
    if (!gameState.gameStarted) return;

    // 检查当前玩家是否存活
    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (currentPlayer.status !== 'alive') {
        elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}已死亡，无法执行抽牌操作！`;
        logEvent(`玩家${gameState.currentPlayer + 1}已死亡，无法执行抽牌操作`);
        return;
    }

    // 检查行动点
    if (!currentPlayer.action || currentPlayer.action < 1) {
        elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}行动点不足，无法执行抽牌操作！`;
        logEvent(`玩家${gameState.currentPlayer + 1}行动点不足，无法执行抽牌操作`);
        return;
    }

    // 获取角色的手牌上限
    const maxCards = characterAttributes[currentPlayer.role].maxCards;
    
    // 检查手牌是否已达上限
    if (currentPlayer.cards >= maxCards) {
        elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}的手牌已达上限！`;
        logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）尝试抽牌，但手牌已达上限`);
        return;
    }

    // 检查道具池是否为空
    if (gameState.itemPool.length === 0) {
        elements.gameMessage.textContent = `道具池已空，无法抽取道具！`;
        logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）尝试抽牌，但道具池已空`);
        return;
    }

    // 保存游戏状态
    saveGameState();

    // 消耗行动点
    currentPlayer.action--;
    logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）消耗1点行动点执行抽牌操作`);

    // 从道具池中随机获取一个道具
    const randomIndex = Math.floor(Math.random() * gameState.itemPool.length);
    const itemName = gameState.itemPool[randomIndex];
    const item = items[itemName];

    // 从道具池中移除该道具
    gameState.itemPool.splice(randomIndex, 1);

    // 添加道具到玩家的道具数组
    currentPlayer.items.push(item);
    currentPlayer.cards++;

    // 更新道具池显示
    updateItemPoolDisplay();

    // 更新UI
    updateUI();

    // 显示消息
    elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}获得了${item.name}！${item.description}`;
    logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）抽取了道具${item.name}（${item.description}）`);
}

// 事件监听器
elements.startGame.addEventListener('click', initGame);
elements.rollDice.addEventListener('click', rollDice);
elements.resetGame.addEventListener('click', async () => {
    await resetGame();
});
elements.undoAction.addEventListener('click', undoAction);
elements.killPlayer.addEventListener('click', killPlayer);
elements.drawCard.addEventListener('click', drawCard);
document.getElementById('random-roles').addEventListener('click', randomRoles);
document.getElementById('end-turn').addEventListener('click', endTurn);

// 初始化页面
window.onload = async function () {
    // 初始化UI
    updateUI();
    // 初始化拖动功能
    initDraggableLog();

    // 添加tab切换逻辑
    initLogTabs();

    // 添加加载道具按钮的事件监听器
    document.getElementById('load-items').addEventListener('click', loadItemsFromFile);
    
    // 添加加载地图按钮的事件监听器
    const mapLoadButton = document.getElementById('load-map');
    if (mapLoadButton) {
        mapLoadButton.addEventListener('click', loadMapFromFile);
    }

    // 添加玩家数量变化事件监听器
    document.getElementById('player-count').addEventListener('change', handlePlayerCountChange);
    
    // 添加随机分配角色按钮的事件监听器
    document.getElementById('random-roles').addEventListener('click', randomRoles);
    
    // 添加开始游戏按钮的事件监听器
    document.getElementById('start-game').addEventListener('click', initGame);

    // 初始化玩家数量显示
    handlePlayerCountChange();

    // 尝试自动加载道具
    updateItemLoadStatus('加载中...');
    const loadedItems = await autoLoadItemsFromCSV();
    if (!loadedItems) {
        updateItemLoadStatus('未加载，请选择文件');
    }
    
    // 尝试自动加载地图
    updateMapLoadStatus('加载中...');
    const loadedMap = await autoLoadMapFromCSV();
    if (!loadedMap) {
        updateMapLoadStatus('未加载，请选择文件');
    }
};

// 初始化日志栏tab切换
function initLogTabs() {
    const tabs = document.querySelectorAll('.log-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function (e) {
            // 阻止事件冒泡，防止触发拖动
            e.stopPropagation();

            // 移除所有tab的active类
            tabs.forEach(t => t.classList.remove('active'));
            // 添加当前tab的active类
            this.classList.add('active');

            // 隐藏所有内容
            const contents = document.querySelectorAll('.log-content');
            contents.forEach(content => content.classList.remove('active'));

            // 显示对应内容
            const tabId = this.dataset.tab;
            document.getElementById(tabId + '-content').classList.add('active');
        });
    });
}