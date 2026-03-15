// 道具配置（从CSV文件中加载）
let items = {};
let itemPool = [];

// 地图格子配置（从CSV文件中加载）
let gridConfig = [];

// 解析道具CSV数据
function parseItemCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const parsedItems = {};
    const newItemPool = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        
        // 新的CSV格式：涉及好感度	涉及行动点	其他功能	序号	道具名	数量	道具描述
        const 涉及好感度 = values[0];
        const 涉及行动点 = values[1];
        const 其他功能 = values[2];
        const id = parseInt(values[3]);
        const name = values[4];
        const quantity = parseInt(values[5]);
        const description = values[6];
        
        // 解析好感度和行动点
        let favor = 0;
        let action = 0;
        
        // 从描述中提取好感度和行动点
        //TODO 优化这段逻辑
        if (涉及好感度 === '是') {
            // 提取好感度值
            const favorMatch = description.match(/增加(\d+)点/);
            if (favorMatch) {
                favor = parseInt(favorMatch[1]);
            }
        }
        
        if (涉及行动点 === '是') {
            // 提取行动点值
            let actionMatch = description.match(/恢复(\d+)行动点/);
            if (!actionMatch) {
                // 尝试匹配"薰使用则为恢复X行动点"模式
                actionMatch = description.match(/薰使用则为恢复(\d+)行动点/);
            }
            if (actionMatch) {
                action = parseInt(actionMatch[1]);
            }
        }
        
        const item = {
            id: id,
            name: name,
            favor: favor,
            action: action,
            description: description,
            quantity: quantity
        };

        // 处理其他功能
        switch (其他功能) {
            case '移动':
                if (name === '洗浴券') {
                    item.targetGrid = 5; // 机械汤是第6个格子，索引为5
                } else if (name === '电影票') {
                    item.targetGrid = 24; // 电影院是第25个格子，索引为24
                } else if (name === '提灯') {
                    item.type = 'custom_move';
                }
                break;
            case '手牌':
                if (name === '玉森的原稿') {
                    item.type = 'steal';
                } else if (name === '钱') {
                    item.type = 'exchange';
                }
                break;
            case '攻击':
                item.type = 'kill_with_weapon';
                if (name === '军刀') {
                    item.weaponType = 'knife';
                } else if (name === '枪') {
                    item.weaponType = 'gun';
                } else if (name === '雕刻刀') {
                    item.weaponType = 'carving_knife';
                }
                break;
            case '防御':
                if (name === '大瓶可尔思必') {
                    item.type = 'colspice';
                }
                break;
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
        const result = parseItemCSV(csvText);
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

// 解析角色CSV数据
function parseRoleCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const characterAttributesData = {};

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const role = {
            type: values[1],
            action: parseInt(values[2]),
            maxCards: parseInt(values[3]),
            initialFavor: parseInt(values[4])
        };

        characterAttributesData[values[0]] = role;
    }

    return characterAttributesData;
}

// 加载角色CSV数据
function loadRolesFromCSV(csvText) {
    try {
        const characterAttributesData = parseRoleCSV(csvText);
        characterAttributes = characterAttributesData;
        console.log('角色配置加载成功:', characterAttributes);
        return true;
    } catch (error) {
        console.error('加载角色配置失败:', error);
        return false;
    }
}

// 尝试自动读取角色CSV文件
async function autoLoadRolesFromCSV() {
    try {
        const response = await fetch('role.csv');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const csvText = await response.text();
        const success = loadRolesFromCSV(csvText);
        if (success) {
            console.log('自动加载角色配置成功');
            return true;
        } else {
            console.log('自动加载角色配置失败');
            return false;
        }
    } catch (error) {
        console.log('自动加载角色配置失败:', error);
        return false;
    }
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

// 角色属性配置（从role.csv文件中加载）
let characterAttributes = {};

// 观察者模式实现
class Observable {
    constructor() {
        this.observers = [];
    }

    subscribe(observer) {
        this.observers.push(observer);
    }

    unsubscribe(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    notify(data) {
        this.observers.forEach(observer => observer(data));
    }
}

// 游戏状态管理器 - 使用观察者模式
class GameStateManager {
    constructor() {
        this.state = {
            players: [
                { type: 'A', role: '水上', cards: 0, items: [], favor: 50, status: 'alive', action: 3, hasKeychain: false },
                { type: 'A', role: '水上', cards: 0, items: [], favor: 50, status: 'alive', action: 3, hasKeychain: false },
                { type: 'A', role: '水上', cards: 0, items: [], favor: 50, status: 'alive', action: 3, hasKeychain: false }
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
        this.observable = new Observable();
    }

    getState() {
        return this.state;
    }

    setState(path, value) {
        const keys = path.split('.');
        let current = this.state;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        this.observable.notify({ path, value, state: this.state });
    }

    updateState(updater) {
        updater(this.state);
        this.observable.notify({ path: 'state', value: this.state, state: this.state });
    }

    subscribe(observer) {
        this.observable.subscribe(observer);
    }

    unsubscribe(observer) {
        this.observable.unsubscribe(observer);
    }
}

// 游戏状态管理器实例
const gameStateManager = new GameStateManager();

// 游戏状态（向后兼容）
let gameState = gameStateManager.getState();

// 道具策略类
class ItemStrategy {
    constructor() {}
    execute(player, playerIndex, item, itemIndex) {}
}

// 移动道具策略
class MoveItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 移动棋子
        const oldPosition = gameState.tokenPosition;
        const oldGrid = gridConfig[oldPosition];
        gameState.tokenPosition = item.targetGrid;
        const newGrid = gridConfig[item.targetGrid];
        updateTokenPosition();

        // 处理好感度和行动点
        if (player.role !== '薰') {
            // 非薰玩家：只增加好感度，不恢复行动点
            if (item.favor > 0) {
                updateFavor(player, item.favor);
                // 记录日志
                logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}，增加了${item.favor}点好感度`);
                // 显示消息
                elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了${item.name}，增加了${item.favor}点好感度，移动到${newGrid.id}.${newGrid.name}！`;
            } else {
                // 记录移动日志
                logEvent(`玩家${playerIndex + 1}使用${item.name}，从${oldGrid.id}.${oldGrid.name}移动到${newGrid.id}.${newGrid.name}`);
                // 显示消息
                elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了${item.name}，移动到${newGrid.id}.${newGrid.name}！`;
            }
        } else {
            // 薰玩家：只恢复行动点，不增加好感度
            if (item.action > 0) {
                player.action += item.action;
                // 记录日志
                logEvent(`玩家${playerIndex + 1}（薰）使用${item.name}，获得了${item.action}点行动点`);
                // 显示消息
                elements.gameMessage.textContent = `玩家${playerIndex + 1}（薰）使用了${item.name}，获得了${item.action}点行动点，移动到${newGrid.id}.${newGrid.name}！`;
            } else {
                // 记录移动日志
                logEvent(`玩家${playerIndex + 1}（薰）使用${item.name}，从${oldGrid.id}.${oldGrid.name}移动到${newGrid.id}.${newGrid.name}`);
                // 显示消息
                elements.gameMessage.textContent = `玩家${playerIndex + 1}（薰）使用了${item.name}，移动到${newGrid.id}.${newGrid.name}！`;
            }
        }

        // 处理行动后逻辑
                handlePostActionLogic(player, playerIndex);

        // 处理新位置的格子功能
        setTimeout(() => {
            handleGridFunction();
        }, 500);

        return false; // 不继续执行后续逻辑
    }
}

// 自定义移动道具策略（提灯）
class CustomMoveItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        let steps = prompt('请输入希望移动的步数（1-6）:', '');

        // 验证输入
        steps = parseInt(steps);
        if (isNaN(steps) || steps < 1 || steps > 6) {
            alert('输入无效，请输入1-6之间的数字！');
            // 恢复行动点
            player.action++;
            return false;
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
        
        // 处理行动后逻辑
        handlePostActionLogic(player, playerIndex);
        
        // 处理新位置的格子功能
        setTimeout(() => {
            handleGridFunction();
        }, 500);
        
        return false;
    }
}

// 反向移动道具策略（手电筒）
class ReverseMoveItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        let steps = prompt('请输入希望移动的步数（1-6）:', '');

        // 验证输入
        steps = parseInt(steps);
        if (isNaN(steps) || steps < 1 || steps > 6) {
            alert('输入无效，请输入1-6之间的数字！');
            // 恢复行动点
            player.action++;
            return false;
        }

        // 移动棋子（反向移动）
        const oldPosition = gameState.tokenPosition;
        const oldGrid = gridConfig[oldPosition];
        if (gameState.reverseDirection) {
            // 当前是逆转方向，向正常方向移动
            gameState.tokenPosition = (gameState.tokenPosition + steps) % 52;
        } else {
            // 当前是正常方向，向逆转方向移动
            gameState.tokenPosition = (gameState.tokenPosition - steps + 52) % 52;
        }
        const newGrid = gridConfig[gameState.tokenPosition];
        updateTokenPosition();

        // 记录移动日志
        logEvent(`玩家${playerIndex + 1}使用${item.name}，从${oldGrid.id}.${oldGrid.name}反向移动了${steps}步到${newGrid.id}.${newGrid.name}`);

        // 显示消息
        elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了${item.name}，反向移动了${steps}步到${newGrid.id}.${newGrid.name}！`;

        // 处理行动后逻辑
                handlePostActionLogic(player, playerIndex);

        // 处理新位置的格子功能
        setTimeout(() => {
            handleGridFunction();
        }, 500);

        return false; // 不继续执行后续逻辑
    }
}

// 抢夺道具策略（玉森的原稿）
class StealItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
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
            return false;
        }

        // 使用GameDialogService创建抢夺道具对话框
        GameDialogService.createStealDialog(
            availablePlayers,
            (itemElement) => {
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
                
                // 显示消息
                elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了${item.name}，从玩家${targetPlayerIndex + 1}（${targetPlayer.role}）手中抢夺了${stolenItem.name}！`;
                
                // 处理行动后逻辑
                handlePostActionLogic(player, playerIndex);
            },
            () => {
                // 恢复行动点
                player.action++;
            }
        );
        return false; // 异步操作，不继续执行后续逻辑
    }
}

// 大瓶可尔思必道具策略
class ColspiceItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 增加好感度或恢复行动点
        if (player.role !== '薰') {
            updateFavor(player, item.favor);
            // 记录日志
            logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}，增加了${item.favor}点好感度`);
            // 显示消息
            elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了${item.name}，增加了${item.favor}点好感度！`;
        } else {
            // 薰无法获得好感度，而是恢复行动点
            player.action += item.action;
            // 记录日志
            logEvent(`玩家${playerIndex + 1}（薰）使用${item.name}，获得了${item.action}点行动点`);
            // 显示消息
            elements.gameMessage.textContent = `玩家${playerIndex + 1}（薰）使用了${item.name}，获得了${item.action}点行动点！`;
        }

        // 处理行动后逻辑
                handlePostActionLogic(player, playerIndex);
        return false; // 不继续执行后续逻辑
    }
}

// 钥匙串道具策略
class KeychainItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 设置钥匙串效果
        player.hasKeychain = true;

        // 记录日志
        logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}，本周目不能成为被杀害的目标`);
        // 显示消息
        elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了${item.name}，本周目不能成为被杀害的目标！`;

        // 处理行动后逻辑
                handlePostActionLogic(player, playerIndex);
        return false; // 不继续执行后续逻辑
    }
}

// 银怀表道具策略
class SilverWatchItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 使用通用对话框函数
        return createActionDeductionDialog(
            player,
            playerIndex,
            item,
            itemIndex,
            1, // 扣除1点行动点
            (targetPlayer) => targetPlayer.action >= 1, // 条件：行动点>=1
            (targetPlayerIndex, targetPlayer) => {
                // 从道具列表中移除
                player.items.splice(itemIndex, 1);
                player.cards = Math.max(0, player.cards - 1);
                
                // 非花泽角色使用此道具会扣10点好感
                if (player.role !== '花泽') {
                    updateFavor(player, -10);
                    logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}，扣除自己10点好感`);
                }
                
                // 记录日志
                logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}，扣除玩家${targetPlayerIndex + 1}（${targetPlayer.role}）1点行动点`);
                // 显示消息
                elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了${item.name}，扣除玩家${targetPlayerIndex + 1}（${targetPlayer.role}）1点行动点${player.role !== '花泽' ? '，并扣除自己10点好感' : ''}！`;
            }
        );
    }
}

// 笔记本道具策略
class NotebookItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 使用通用对话框函数
        return createActionDeductionDialog(
            player,
            playerIndex,
            item,
            itemIndex,
            2, // 扣除2点行动点
            (targetPlayer) => targetPlayer.action >= 1, // 条件：行动点>=1
            (targetPlayerIndex, targetPlayer) => {
                // 从道具列表中移除
                player.items.splice(itemIndex, 1);
                player.cards = Math.max(0, player.cards - 1);
                
                // 非水上角色使用此道具会扣10点好感
                if (player.role !== '水上') {
                    updateFavor(player, -10);
                    logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}，扣除自己10点好感`);
                }
                
                // 记录日志
                logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}，扣除玩家${targetPlayerIndex + 1}（${targetPlayer.role}）2点行动点`);
                // 显示消息
                elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了${item.name}，扣除玩家${targetPlayerIndex + 1}（${targetPlayer.role}）2点行动点${player.role !== '水上' ? '，并扣除自己10点好感' : ''}！`;
            }
        );
    }
}

// 钱道具策略
class MoneyItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 使用GameDialogService创建交换道具对话框
        GameDialogService.createExchangeDialog(
            (exchangeType) => {
                if (exchangeType === 'draw') {
                    // 从牌堆抽取
                    if (gameState.itemPool.length > 0) {
                        const randomIndex = Math.floor(Math.random() * gameState.itemPool.length);
                        const itemName = gameState.itemPool[randomIndex];
                        const newItem = items[itemName];

                        // 从道具池中移除该道具
                        gameState.itemPool.splice(randomIndex, 1);

                        // 添加道具到玩家的道具数组
                        player.items.push(newItem);
                        player.cards++;

                        // 从当前玩家的道具栏中移除钱（一次性道具）
                        player.items.splice(itemIndex, 1);
                        player.cards = Math.max(0, player.cards - 1);

                        // 记录日志
                        logEvent(`玩家${playerIndex + 1}（${player.role}）使用钱，从牌堆抽取了道具${newItem.name}`);

                        // 显示消息
                        elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了钱，从牌堆抽取了道具${newItem.name}！`;

                        // 更新道具池显示
                        updateItemPoolDisplay();

                        // 处理行动后逻辑
                        handlePostActionLogic(player, playerIndex);
                    } else {
                        elements.gameMessage.textContent = '道具池已空，无法抽取道具！';
                        logEvent(`玩家${playerIndex + 1}（${player.role}）尝试使用钱从牌堆抽取道具，但道具池已空`);
                        // 恢复行动点
                        player.action++;
                    }
                } else if (exchangeType === 'player') {
                    // 从其他玩家交换
                    // 过滤出其他存活玩家
                    const availablePlayers = [];
                    gameState.players.forEach((targetPlayer, targetIndex) => {
                        if (targetIndex !== playerIndex && targetPlayer.status === 'alive' && targetPlayer.items.length > 0) {
                            availablePlayers.push(targetIndex);
                        }
                    });

                    if (availablePlayers.length === 0) {
                        elements.gameMessage.textContent = '没有可交换的目标！';
                        logEvent(`玩家${playerIndex + 1}（${player.role}）尝试使用钱从其他玩家交换道具，但没有可交换的目标`);
                        // 恢复行动点
                        player.action++;
                        return;
                    }

                    // 使用GameDialogService创建玩家道具选择对话框
                    GameDialogService.createPlayerItemDialog(
                        availablePlayers,
                        (itemElement) => {
                            const targetPlayerIndex = parseInt(itemElement.dataset.targetPlayer);
                            const targetItemIndex = parseInt(itemElement.dataset.itemIndex);
                            
                            // 交换道具
                            const targetPlayer = gameState.players[targetPlayerIndex];
                            const targetItem = targetPlayer.items[targetItemIndex];
                            
                            // 从目标玩家手中移除道具
                            targetPlayer.items.splice(targetItemIndex, 1);
                            targetPlayer.cards = Math.max(0, targetPlayer.cards - 1);
                            
                            // 添加到当前玩家手中
                            player.items.push(targetItem);
                            player.cards++;
                            
                            // 从当前玩家的道具栏中移除钱（一次性道具）
                            player.items.splice(itemIndex, 1);
                            player.cards = Math.max(0, player.cards - 1);
                            
                            // 记录日志
                            logEvent(`玩家${playerIndex + 1}（${player.role}）使用钱，从玩家${targetPlayerIndex + 1}（${targetPlayer.role}）手中交换了${targetItem.name}`);
                            
                            // 显示消息
                            elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了钱，从玩家${targetPlayerIndex + 1}（${targetPlayer.role}）手中交换了${targetItem.name}！`;
                            
                            // 处理行动后逻辑
                            handlePostActionLogic(player, playerIndex);
                        },
                        () => {
                            // 恢复行动点
                            player.action++;
                        }
                    );
                }
            },
            () => {
                // 恢复行动点
                player.action++;
            }
        );
        return false; // 异步操作，不继续执行后续逻辑
    }
}



// 武器道具策略
class WeaponItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 处理武器类道具
        handleWeaponItem(player, playerIndex, itemIndex, item);
        return false; // 不继续执行后续逻辑
    }
}

// 好感度/行动点道具策略
class FavorItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 处理好感度和行动点
        if (player.role !== '薰') {
            // 非薰玩家：只增加好感度，不恢复行动点
            if (item.favor > 0) {
                updateFavor(player, item.favor);
                // 记录日志
                logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}，增加了${item.favor}点好感度`);
                // 显示消息
                elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了${item.name}，增加了${item.favor}点好感度！`;
            }
        } else {
            // 薰玩家：只恢复行动点，不增加好感度
            if (item.action > 0) {
                player.action += item.action;
                // 记录日志
                logEvent(`玩家${playerIndex + 1}（薰）使用${item.name}，获得了${item.action}点行动点`);
                // 显示消息
                elements.gameMessage.textContent = `玩家${playerIndex + 1}（薰）使用了${item.name}，获得了${item.action}点行动点！`;
            }
        }

        // 处理行动后逻辑
                handlePostActionLogic(player, playerIndex);
        return false; // 不继续执行后续逻辑
    }
}

// 行动点恢复道具策略
class ActionItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 恢复行动点（全体人员都可以恢复）
        if (item.action > 0) {
            player.action += item.action;
            // 记录日志
            logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}，获得了${item.action}点行动点`);
            // 显示消息
            elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了${item.name}，获得了${item.action}点行动点！`;
        }

        // 处理行动后逻辑
                handlePostActionLogic(player, playerIndex);
        return false; // 不继续执行后续逻辑
    }
}

// 道具类型到策略的映射表
const itemStrategyMap = {
    'move': MoveItemStrategy,
    'custom_move': CustomMoveItemStrategy,
    'reverse_move': ReverseMoveItemStrategy,
    'steal': StealItemStrategy,
    'colspice': ColspiceItemStrategy,
    'exchange': MoneyItemStrategy,
    'kill_with_weapon': WeaponItemStrategy,
    'favor': FavorItemStrategy,
    'action': ActionItemStrategy,
    'keychain': KeychainItemStrategy,
    'silver_watch': SilverWatchItemStrategy,
    'notebook': NotebookItemStrategy
};

// 道具名称到类型的映射表
const itemNameToTypeMap = {
    '大瓶可尔思必': 'colspice',
    '可尔思必': 'favor',
    '洗浴券': 'favor',
    '电影票': 'favor',
    '蛋包饭': 'action',
    '咖啡': 'action',
    '手电筒': 'reverse_move',
    '钥匙串': 'keychain',
    '银怀表': 'silver_watch',
    '笔记本': 'notebook'
};

// 游戏对话框服务
class GameDialogService {
    // 创建通用对话框
    static createDialog(dialogClass, contentClass, title, content, cancelText, onConfirm, onCancel) {
        // 创建弹出框
        const dialog = document.createElement('div');
        dialog.className = dialogClass;
        dialog.innerHTML = `
            <div class="${contentClass}">
                <h3>${title}</h3>
                <div>${content}</div>
                <button class="cancel-button">${cancelText}</button>
            </div>
        `;
        document.body.appendChild(dialog);

        // 处理确认事件
        if (onConfirm) {
            const confirmElements = dialog.querySelectorAll('[data-action="confirm"]');
            confirmElements.forEach(element => {
                element.addEventListener('click', () => {
                    onConfirm(element);
                    this.closeDialog(dialog);
                });
            });
        }

        // 处理取消按钮
        const cancelButton = dialog.querySelector('.cancel-button');
        cancelButton.addEventListener('click', () => {
            if (onCancel) {
                onCancel();
            }
            this.closeDialog(dialog);
        });

        return dialog;
    }

    // 创建抢夺道具对话框
    static createStealDialog(availablePlayers, onSteal, onCancel) {
        // 构建选择界面
        let stealOptions = '';
        availablePlayers.forEach(targetIndex => {
            const targetPlayer = gameState.players[targetIndex];
            stealOptions += `<h4>玩家${targetIndex + 1}（${targetPlayer.role}）的道具：</h4>`;
            targetPlayer.items.forEach((targetItem, itemIndex) => {
                stealOptions += `<div class="steal-item" data-target-player="${targetIndex}" data-item-index="${itemIndex}">${targetItem.name} - ${targetItem.description}</div>`;
            });
        });

        // 创建对话框
        const dialog = this.createDialog(
            'steal-dialog',
            'steal-dialog-content',
            '选择要使用原稿交换的道具：',
            `<div class="steal-options">${stealOptions}</div>`,
            '取消',
            null,
            onCancel
        );

        // 处理道具选择
        const stealItems = dialog.querySelectorAll('.steal-item');
        stealItems.forEach(itemElement => {
            itemElement.addEventListener('click', () => {
                onSteal(itemElement);
                this.closeDialog(dialog);
            });
        });

        // 添加样式
        this.addDialogStyle('steal-dialog');

        return dialog;
    }

    // 创建交换道具对话框
    static createExchangeDialog(onExchange, onCancel) {
        // 创建对话框
        const dialog = this.createDialog(
            'exchange-dialog',
            'exchange-dialog-content',
            '选择交换方式：',
            `<div class="exchange-options">
                <div class="exchange-option" data-type="draw">从牌堆抽取</div>
                <div class="exchange-option" data-type="player">从其他玩家交换</div>
            </div>`,
            '取消',
            null,
            onCancel
        );

        // 处理交换方式选择
        const exchangeOptions = dialog.querySelectorAll('.exchange-option');
        exchangeOptions.forEach(option => {
            option.addEventListener('click', () => {
                onExchange(option.dataset.type);
                this.closeDialog(dialog);
            });
        });

        // 添加样式
        this.addDialogStyle('exchange-dialog');

        return dialog;
    }

    // 创建玩家道具选择对话框
    static createPlayerItemDialog(availablePlayers, onSelect, onCancel) {
        // 构建选择界面
        let playerOptions = '';
        availablePlayers.forEach(targetIndex => {
            const targetPlayer = gameState.players[targetIndex];
            playerOptions += `<h4>玩家${targetIndex + 1}（${targetPlayer.role}）的道具：</h4>`;
            targetPlayer.items.forEach((targetItem, itemIndex) => {
                playerOptions += `<div class="player-item" data-target-player="${targetIndex}" data-item-index="${itemIndex}">${targetItem.name} - ${targetItem.description}</div>`;
            });
        });

        // 创建对话框
        const dialog = this.createDialog(
            'player-dialog',
            'player-dialog-content',
            '选择要交换的道具：',
            `<div class="player-options">${playerOptions}</div>`,
            '取消',
            null,
            onCancel
        );

        // 处理道具选择
        const playerItems = dialog.querySelectorAll('.player-item');
        playerItems.forEach(itemElement => {
            itemElement.addEventListener('click', () => {
                onSelect(itemElement);
                this.closeDialog(dialog);
            });
        });

        // 添加样式
        this.addDialogStyle('player-dialog');

        return dialog;
    }

    // 创建武器目标选择对话框
    static createWeaponDialog(availablePlayers, onSelect, onCancel) {
        // 构建选择界面
        let killOptions = '';
        availablePlayers.forEach(targetIndex => {
            const targetPlayer = gameState.players[targetIndex];
            killOptions += `<div class="kill-item" data-target-player="${targetIndex}">玩家${targetIndex + 1}（${targetPlayer.role}）- 剩余行动点：${targetPlayer.action || 0}</div>`;
        });

        // 创建对话框
        const dialog = this.createDialog(
            'kill-dialog',
            'kill-dialog-content',
            '选择要杀死的角色：',
            `<div class="kill-options">${killOptions}</div>`,
            '取消',
            null,
            onCancel
        );

        // 处理目标选择
        const killItems = dialog.querySelectorAll('.kill-item');
        killItems.forEach(itemElement => {
            itemElement.addEventListener('click', () => {
                onSelect(itemElement);
                this.closeDialog(dialog);
            });
        });

        // 添加样式
        this.addDialogStyle('kill-dialog');

        return dialog;
    }

    // 添加对话框样式
    static addDialogStyle(dialogClass) {
        // 检查是否已经添加了样式
        if (document.getElementById(`${dialogClass}-style`)) {
            return;
        }

        // 创建样式
        const style = document.createElement('style');
        style.id = `${dialogClass}-style`;
        style.textContent = `
            .${dialogClass} {
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
            .${dialogClass}-content {
                background-color: white;
                padding: 20px;
                border-radius: 5px;
                width: 80%;
                max-width: 600px;
                max-height: 80%;
                overflow-y: auto;
            }
            .${dialogClass} .cancel-button {
                margin-top: 20px;
                padding: 10px;
                background-color: #ccc;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
        `;

        // 添加特定样式
        if (dialogClass === 'steal-dialog') {
            style.textContent += `
                .steal-item {
                    padding: 10px;
                    border: 1px solid #ccc;
                    margin: 5px 0;
                    cursor: pointer;
                }
                .steal-item:hover {
                    background-color: #f0f0f0;
                }
            `;
        } else if (dialogClass === 'exchange-dialog') {
            style.textContent += `
                .exchange-option {
                    padding: 10px;
                    border: 1px solid #ccc;
                    margin: 5px 0;
                    cursor: pointer;
                }
                .exchange-option:hover {
                    background-color: #f0f0f0;
                }
            `;
        } else if (dialogClass === 'player-dialog') {
            style.textContent += `
                .player-item {
                    padding: 10px;
                    border: 1px solid #ccc;
                    margin: 5px 0;
                    cursor: pointer;
                }
                .player-item:hover {
                    background-color: #f0f0f0;
                }
            `;
        } else if (dialogClass === 'kill-dialog') {
            style.textContent += `
                .kill-item {
                    padding: 10px;
                    border: 1px solid #ccc;
                    margin: 5px 0;
                    cursor: pointer;
                }
                .kill-item:hover {
                    background-color: #f0f0f0;
                }
            `;
        }

        document.head.appendChild(style);
    }

    // 关闭对话框
    static closeDialog(dialog) {
        if (dialog) {
            document.body.removeChild(dialog);
        }
    }
}

// 道具策略工厂
class ItemStrategyFactory {
    static getStrategy(item) {
        // 首先检查道具类型
        if (item.targetGrid !== undefined) {
            return new MoveItemStrategy();
        }
        
        // 检查道具名称映射
        if (itemNameToTypeMap[item.name]) {
            const strategyClass = itemStrategyMap[itemNameToTypeMap[item.name]];
            if (strategyClass) {
                return new strategyClass();
            }
        }
        
        // 检查道具类型映射
        if (item.type && itemStrategyMap[item.type]) {
            const strategyClass = itemStrategyMap[item.type];
            return new strategyClass();
        }
        
        return new ItemStrategy(); // 默认策略
    }
}

// 地格策略类
class GridStrategy {
    constructor() {}
    execute(grid, player) {}
}

// 好感度效果地格策略
class FavorGridStrategy extends GridStrategy {
    execute(grid, player) {
        const favorEffect = grid.favorEffect;
        if (favorEffect.type === 'player') {
            // 掷出此骰子的玩家好感度+10
            if (player.type === 'A') {
                updateFavor(player, favorEffect.value);
                elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}获得了${favorEffect.value}点好感度！`;
                logEvent(`触发效果：玩家${gameState.currentPlayer + 1}获得了${favorEffect.value}点好感度`);
            } else if (player.role === '薰') {
                // 薰无法获得好感度，而是恢复行动点
                // 从grid的道具Effect中获取行动点恢复值，如果没有则使用默认值
                const actionPoints = grid.道具Effect ? grid.道具Effect.value : Math.floor(favorEffect.value / 10);
                player.action += actionPoints;
                elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}（薰）获得了${actionPoints}点行动点！`;
                logEvent(`触发效果：玩家${gameState.currentPlayer + 1}（薰）获得了${actionPoints}点行动点`);
            } else {
                elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}（B类型）无法获得好感度！`;
                logEvent(`触发效果：玩家${gameState.currentPlayer + 1}（B类型）无法获得好感度`);
            }
        } else if (favorEffect.type === 'role') {
            // A类某种角色的所有玩家好感度+10
            let affectedPlayers = 0;
            let kaoruAffected = false;
            let actionPoints = grid.道具Effect ? grid.道具Effect.value : Math.floor(favorEffect.value / 10);
            gameState.players.forEach((targetPlayer, index) => {
                if (targetPlayer.role === '薰' && targetPlayer.status === 'alive') {
                    // 薰无法获得好感度，而是恢复行动点
                    targetPlayer.action += actionPoints;
                    kaoruAffected = true;
                } else if (targetPlayer.type === 'A' && targetPlayer.role === favorEffect.role && targetPlayer.status === 'alive') {
                    updateFavor(targetPlayer, favorEffect.value);
                    affectedPlayers++;
                }
            });
            if (affectedPlayers > 0) {
                elements.gameMessage.textContent = `所有${favorEffect.role}角色获得了${favorEffect.value}点好感度！`;
                logEvent(`触发效果：所有${favorEffect.role}角色获得了${favorEffect.value}点好感度`);
            } else if (kaoruAffected) {
                elements.gameMessage.textContent = `薰获得了${actionPoints}点行动点！`;
                logEvent(`触发效果：薰获得了${actionPoints}点行动点`);
            } else {
                elements.gameMessage.textContent = `没有${favorEffect.role}角色在场！`;
                logEvent(`触发效果：没有${favorEffect.role}角色在场`);
            }
        } else if (favorEffect.type === 'all') {
            // 全员好感度+10
            let affectedPlayers = 0;
            let kaoruAffected = false;
            let actionPoints = grid.道具Effect ? grid.道具Effect.value : Math.floor(favorEffect.value / 10);
            gameState.players.forEach((targetPlayer, index) => {
                if (targetPlayer.role === '薰' && targetPlayer.status === 'alive') {
                    // 薰无法获得好感度，而是恢复行动点
                    targetPlayer.action += actionPoints;
                    kaoruAffected = true;
                } else if (targetPlayer.type === 'A' && targetPlayer.status === 'alive') {
                    updateFavor(targetPlayer, favorEffect.value);
                    affectedPlayers++;
                }
            });
            if (affectedPlayers > 0) {
                elements.gameMessage.textContent = `所有A类型角色获得了${favorEffect.value}点好感度！`;
                logEvent(`触发效果：所有A类型角色获得了${favorEffect.value}点好感度`);
            } else if (kaoruAffected) {
                elements.gameMessage.textContent = `薰获得了${actionPoints}点行动点！`;
                logEvent(`触发效果：薰获得了${actionPoints}点行动点`);
            } else {
                elements.gameMessage.textContent = `没有A类型角色在场！`;
                logEvent(`触发效果：没有A类型角色在场`);
            }
        }
    }
}

// 道具效果地格策略
class ItemGridStrategy extends GridStrategy {
    execute(grid, player) {
        const 道具Effect = grid.道具Effect;
        if (道具Effect.type === 'add') {
            // 计算添加后的手牌数量
            const newCardsCount = player.cards + 道具Effect.value;

            // 获取角色的手牌上限
            const maxCards = characterAttributes[player.role].maxCards;

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
                    player.items.push(item);
                    player.cards = newCardsCount;

                    // 记录日志
                    logEvent(`触发效果：玩家${gameState.currentPlayer + 1}（${player.role}）获得了道具${item.name}`);

                    // 显示消息
                    elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}获得了道具${item.name}！`;

                    // 更新道具池显示
                    updateItemPoolDisplay();
                } else {
                    elements.gameMessage.textContent = '道具池已空，无法获得道具！';
                    logEvent(`触发效果：道具池已空，玩家${gameState.currentPlayer + 1}（${player.role}）无法获得道具`);
                }
            } else {
                elements.gameMessage.textContent = '手牌数量已达到上限，无法获得更多道具！';
                logEvent(`触发效果：玩家${gameState.currentPlayer + 1}（${player.role}）手牌数量已达到上限，无法获得更多道具`);
            }
        }
    }
}

// 停滞格子策略
class StagnantGridStrategy extends GridStrategy {
    execute(grid, player) {
        // 停滞格子逻辑
        gameState.stagnantTurn = gameState.currentPlayer;
        elements.gameMessage.textContent = `棋子停留在停滞格子上，${gameState.currentPlayer + 1}玩家本回合无法移动！`;
        logEvent(`触发效果：棋子停留在停滞格子上，${gameState.currentPlayer + 1}玩家本回合无法移动`);
    }
}

// 水坑格子策略
class WaterGridStrategy extends GridStrategy {
    execute(grid, player) {
        // 进入水坑，立刻结束行动，周目+1
        elements.gameMessage.textContent = `棋子进入水坑，结束行动，周目+1！`;
        logEvent(`触发效果：棋子进入水坑，结束行动，周目+1`);

        // 周目+1
        gameState.week++;

        // 移动方向逆转
        gameState.reverseDirection = !gameState.reverseDirection;

        // 重置所有人的行动点为初始行动点
        gameState.players.forEach((player, index) => {
            player.action = characterAttributes[player.role].action;
            // 重置钥匙串效果
            player.hasKeychain = false;
            // 如果玩家死亡，复活并重置好感度
            if (player.status === 'die') {
                player.status = 'alive';
                player.favor = characterAttributes[player.role].initialFavor;
                logEvent(`玩家${index + 1}（${player.role}）被复活，好感度重置为初始值`);
            }
        });

        // 结束当前玩家的行动
        endTurn();
    }
}

// 地格策略工厂
class GridStrategyFactory {
    static getStrategies(grid) {
        const strategies = [];
        
        // 好感度效果策略
        if (grid.favorEffect) {
            strategies.push(new FavorGridStrategy());
        }
        
        // 道具效果策略
        if (grid.道具Effect) {
            strategies.push(new ItemGridStrategy());
        }
        
        // 停滞格子策略
        if (grid.isStagnant) {
            strategies.push(new StagnantGridStrategy());
        }
        
        // 水坑格子策略
        if (grid.types && grid.types.includes('水坑')) {
            strategies.push(new WaterGridStrategy());
        }
        
        return strategies;
    }
}



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
    directionIndicator: document.getElementById('direction-indicator'),
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
    
    // 检查角色配置是否已加载
    if (Object.keys(characterAttributes).length === 0) {
        alert('请先加载角色配置CSV文件！');
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

    // 设置玩家属性和重置游戏状态（使用观察者模式）
    gameStateManager.updateState((state) => {
        state.players = [];
        for (let i = 0; i < playerCount; i++) {
            const role = playerRoles[i];
            state.players.push({
                type: characterAttributes[role].type,
                role: role,
                cards: 0,
                items: [],
                favor: characterAttributes[role].initialFavor,
                status: 'alive',
                action: characterAttributes[role].action,
                hasKeychain: false
            });
        }

        state.currentPlayer = 0;
        state.tokenPosition = 0;
        state.gameStarted = true;
        state.gameWon = false;
        state.week = 1;
        state.reverseDirection = false;
        state.stagnantTurn = -1;
    });
    
    // 确保棋子位置正确更新
    updateTokenPosition();
    
    // 生成地图格子
    generateMapGrid();

    // 重新初始化道具池和为玩家抽取道具（使用观察者模式）
    gameStateManager.updateState((state) => {
        state.itemPool = [...itemPool];

        // 为所有玩家设置初始行动点
        for (let i = 0; i < playerCount; i++) {
            const player = state.players[i];
            player.action = characterAttributes[player.role].action;
        }
    });

    // 游戏开始时，为所有玩家依次随机抽取能够拥有的最大道具数量的道具
    let startMessage = '游戏开始！玩家1先开始掷骰子。';
    gameStateManager.updateState((state) => {
        for (let i = 0; i < playerCount; i++) {
            const player = state.players[i];
            const maxCards = characterAttributes[player.role].maxCards;
            
            // 为玩家抽取最大数量的道具
            while (player.cards < maxCards && state.itemPool.length > 0) {
                const randomIndex = Math.floor(Math.random() * state.itemPool.length);
                const itemName = state.itemPool[randomIndex];
                const item = items[itemName];

                // 从道具池中移除该道具
                state.itemPool.splice(randomIndex, 1);

                // 添加道具到玩家的道具数组
                player.items.push(item);
                player.cards++;

                logEvent(`玩家${i + 1}（${player.role}）游戏开始，获得道具${item.name}`);
            }
        }
    });

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

    // 检查行动点（特殊角色使用特定武器或道具不消耗行动点，所以即使行动点为0也可以使用）
    const actionPoints = Number(player.action) || 0;
    let canUseWithoutAction = false;
    
    // 检查是否为特殊角色使用特定武器或道具
    if (item.type === 'kill_with_weapon') {
        switch (item.weaponType) {
            case 'knife': // 军刀
                if (player.role === '花泽') {
                    canUseWithoutAction = true;
                }
                break;
            case 'gun': // 枪
                if (player.role === '博士') {
                    canUseWithoutAction = true;
                }
                break;
            case 'carving_knife': // 雕刻刀
                if (player.role === '水上') {
                    canUseWithoutAction = true;
                }
                break;
        }
    } else if (item.name === '钥匙串') {
        if (player.role === '川濑') {
            canUseWithoutAction = true;
        }
    }
    
    if (actionPoints <= 0 && !canUseWithoutAction) {
        elements.gameMessage.textContent = `玩家${playerIndex + 1}行动点不足，无法使用道具！`;
        logEvent(`玩家${playerIndex + 1}行动点不足，无法使用道具`);
        return;
    }

    if (item && player.cards > 0) {
        // 检查是否为被动道具
        if (item.name === '念珠') {
            elements.gameMessage.textContent = `念珠是被动道具，无法主动使用！`;
            logEvent(`玩家${playerIndex + 1}（${player.role}）尝试主动使用念珠，但念珠是被动道具`);
            return;
        }

        // 保存游戏状态
        saveGameState();

        // 消耗行动点（特殊角色使用特定武器或道具不消耗行动点）
        let shouldConsumeAction = true;
        if (item.type === 'kill_with_weapon') {
            switch (item.weaponType) {
                case 'knife': // 军刀
                    if (player.role === '花泽') {
                        shouldConsumeAction = false;
                    }
                    break;
                case 'gun': // 枪
                    if (player.role === '博士') {
                        shouldConsumeAction = false;
                    }
                    break;
                case 'carving_knife': // 雕刻刀
                    if (player.role === '水上') {
                        shouldConsumeAction = false;
                    }
                    break;
            }
        } else if (item.name === '钥匙串') {
            if (player.role === '川濑') {
                shouldConsumeAction = false;
            }
        } else if (item.name === '念珠') {
            if (player.role === '水上' || player.role === '薰') {
                shouldConsumeAction = false;
            }
        }
        if (shouldConsumeAction) {
            player.action = Number(player.action) || 0;
            player.action--;
            logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);
        } else {
            logEvent(`玩家${playerIndex + 1}（${player.role}）使用道具（特殊：不消耗行动点）`);
        }

        // 使用策略模式处理道具效果
        const strategy = ItemStrategyFactory.getStrategy(item);
        const shouldContinue = strategy.execute(player, playerIndex, item, itemIndex);

        // 从道具列表中移除（特殊道具已在各自的策略中处理）
        if (shouldContinue !== false && item.type !== 'steal' && item.name !== '大瓶可尔思必' && item.name !== '念珠' && item.type !== 'exchange' && item.type !== 'kill_with_weapon' && item.type !== 'favor' && item.type !== 'action' && item.type !== 'move' && item.type !== 'reverse_move') {
            player.items.splice(itemIndex, 1);
            player.cards = Math.max(0, player.cards - 1);

            // 显示消息
            let message = `玩家${playerIndex + 1}使用了${item.name}`;
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
                // 处理行动后逻辑
                handlePostActionLogic(player, playerIndex);
            }
        }
    }
}

// 更新方向指示器
function updateDirectionIndicator() {
    if (elements.directionIndicator) {
        elements.directionIndicator.textContent = gameState.reverseDirection ? '逆时针' : '顺时针';
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

    // 更新方向指示器
    updateDirectionIndicator();

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
    const actionPoints = Number(currentPlayer.action) || 0;
    if (actionPoints <= 0) {
        elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}行动点不足，无法掷骰子！`;
        logEvent(`玩家${gameState.currentPlayer + 1}行动点不足，无法掷骰子`);
        return;
    }

    // 保存游戏状态
    saveGameState();

    // 消耗行动点
    currentPlayer.action = Number(currentPlayer.action) || 0;
    currentPlayer.action--;
    logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）消耗1点行动点掷骰子，剩余行动点：${currentPlayer.action}`);

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

// 处理好感度变更
function updateFavor(player, change) {
    // 假设好感度上限为100，下限为0
    const maxFavor = 100;
    const minFavor = 0;
    
    player.favor = Math.max(minFavor, Math.min(maxFavor, player.favor + change));
}

// 创建扣除行动点的目标选择对话框
function createActionDeductionDialog(player, playerIndex, item, itemIndex, actionDeduction, conditionFn, afterSelectFn) {
    // 生成可选择的玩家列表
    const availablePlayers = [];
    for (let i = 0; i < gameState.players.length; i++) {
        if (i !== playerIndex && gameState.players[i].status === 'alive' && conditionFn(gameState.players[i])) {
            availablePlayers.push(i);
        }
    }

    if (availablePlayers.length === 0) {
        elements.gameMessage.textContent = '没有可选择的目标！';
        logEvent(`玩家${playerIndex + 1}（${player.role}）尝试使用${item.name}，但没有可选择的目标`);
        // 返还行动点
        player.action = Number(player.action) || 0;
        player.action++;
        logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}失败，返还1点行动点`);
        return false;
    }

    // 构建选择界面
    let targetOptions = '';
    availablePlayers.forEach(targetIndex => {
        const targetPlayer = gameState.players[targetIndex];
        targetOptions += `<div class="target-item" data-target-player="${targetIndex}">玩家${targetIndex + 1}（${targetPlayer.role}）- 剩余行动点：${targetPlayer.action || 0}</div>`;
    });

    // 创建弹出框
    const targetDialog = document.createElement('div');
    targetDialog.className = 'target-dialog';
    targetDialog.innerHTML = `
        <div class="target-dialog-content">
            <h3>选择要扣除行动点的角色：</h3>
            <div class="target-options">${targetOptions}</div>
            <button class="cancel-target">取消</button>
        </div>
    `;
    document.body.appendChild(targetDialog);

    // 添加样式
    addTargetDialogStyle('target-dialog');

    // 处理目标选择
    const targetItems = targetDialog.querySelectorAll('.target-item');
    targetItems.forEach(itemElement => {
        itemElement.addEventListener('click', () => {
            const targetPlayerIndex = parseInt(itemElement.dataset.targetPlayer);
            const targetPlayer = gameState.players[targetPlayerIndex];
            
            // 扣除目标玩家行动点
            targetPlayer.action = Math.max(0, targetPlayer.action - actionDeduction);
            
            // 执行选择后的回调
            afterSelectFn(targetPlayerIndex, targetPlayer);
            
            // 移除对话框
            document.body.removeChild(targetDialog);
            
            // 处理行动后逻辑
            handlePostActionLogic(player, playerIndex);
        });
    });

    // 处理取消按钮
    const cancelButton = targetDialog.querySelector('.cancel-target');
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(targetDialog);
        // 恢复行动点
        player.action++;
    });

    return false; // 异步操作，不继续执行后续逻辑
}

// 添加目标对话框样式
function addTargetDialogStyle(dialogClass) {
    // 检查是否已经添加了样式
    if (document.getElementById(`${dialogClass}-style`)) {
        return;
    }

    // 创建样式
    const style = document.createElement('style');
    style.id = `${dialogClass}-style`;
    style.textContent = `
        .${dialogClass} {
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
        .${dialogClass}-content {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            width: 80%;
            max-width: 600px;
            max-height: 80%;
            overflow-y: auto;
        }
        .${dialogClass} .cancel-target {
            margin-top: 20px;
            padding: 10px;
            background-color: #ccc;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        .target-item {
            padding: 10px;
            border: 1px solid #ccc;
            margin: 5px 0;
            cursor: pointer;
        }
        .target-item:hover {
            background-color: #f0f0f0;
        }
    `;

    document.head.appendChild(style);
}

// 处理行动后逻辑
function handlePostActionLogic(player, playerIndex) {
    // 确保行动点是数字
    player.action = Number(player.action) || 0;
    
    // 更新UI
    updateUI();

    // 检查行动点是否为0
    if (player.action <= 0) {
        // 行动点已耗尽，显示提示信息，但不自动结束行动
        elements.gameMessage.textContent = `玩家${playerIndex + 1}行动点已耗尽，请点击结束回合按钮结束本轮行动。`;
        logEvent(`玩家${playerIndex + 1}行动点已耗尽`);
        // 禁用掷骰子按钮
        elements.rollDice.disabled = true;
    } else {
        // 检查是否在停滞格子上
        const currentGrid = gridConfig[gameState.tokenPosition];
        if (!currentGrid.isStagnant) {
            // 不在停滞格子上，重新启用掷骰子按钮
            elements.rollDice.disabled = false;
            elements.gameMessage.textContent = `玩家${playerIndex + 1}还有${player.action}点行动点，可以继续操作。`;
        } else {
            // 在停滞格子上，保持掷骰子按钮禁用
            elements.rollDice.disabled = true;
        }
    }
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

// 处理武器类道具
function handleWeaponItem(player, playerIndex, itemIndex, item) {
    // 根据武器类型确定目标选择条件
    const getAvailablePlayers = () => {
        const availablePlayers = [];
        gameState.players.forEach((targetPlayer, targetIndex) => {
            // 检查目标是否使用了钥匙串
            if (targetPlayer.hasKeychain) {
                return; // 无法攻击使用了钥匙串的玩家
            }
            
            let canTarget = false;
            
            switch (item.weaponType) {
                case 'knife': // 军刀
                    canTarget = targetIndex !== playerIndex && targetPlayer.status === 'alive' && (targetPlayer.action <= 1 || targetPlayer.action === undefined || targetPlayer.action === null);
                    break;
                case 'gun': // 枪
                    canTarget = targetIndex !== playerIndex && targetPlayer.status === 'alive' && (targetPlayer.action <= 2 || targetPlayer.action === undefined || targetPlayer.action === null);
                    break;
                case 'carving_knife': // 雕刻刀
                    canTarget = (targetIndex === playerIndex && player.role === '水上') || (targetIndex !== playerIndex && targetPlayer.status === 'alive' && (targetPlayer.action === 0 || targetPlayer.action === undefined || targetPlayer.action === null));
                    break;
            }
            
            if (canTarget) {
                availablePlayers.push(targetIndex);
            }
        });
        return availablePlayers;
    };
    
    // 获取可用目标
    const availablePlayers = getAvailablePlayers();
    
    if (availablePlayers.length === 0) {
        elements.gameMessage.textContent = '没有可杀死的目标！';
        logEvent(`玩家${playerIndex + 1}（${player.role}）尝试使用${item.name}，但没有符合条件的目标`);
        // 检查是否是特殊角色使用特定武器（不消耗行动点）
        let shouldConsumeAction = true;
        switch (item.weaponType) {
            case 'knife': // 军刀
                if (player.role === '花泽') {
                    shouldConsumeAction = false;
                }
                break;
            case 'gun': // 枪
                if (player.role === '博士') {
                    shouldConsumeAction = false;
                }
                break;
            case 'carving_knife': // 雕刻刀
                if (player.role === '水上') {
                    shouldConsumeAction = false;
                }
                break;
        }
        // 只有消耗了行动点的情况下才恢复
        if (shouldConsumeAction) {
            player.action++;
        }
        return;
    }

    // 使用GameDialogService创建武器目标选择对话框
    GameDialogService.createWeaponDialog(
        availablePlayers,
        (itemElement) => {
            const targetPlayerIndex = parseInt(itemElement.dataset.targetPlayer);
            const targetPlayer = gameState.players[targetPlayerIndex];
            
            // 保存游戏状态
            saveGameState();
            
            // 从当前玩家的道具栏中移除武器（一次性道具）
            player.items.splice(itemIndex, 1);
            player.cards = Math.max(0, player.cards - 1);
            
            // 检查目标玩家是否持有防御道具
            let hasDefense = false;
            let defenseIndex = -1;
            let defenseItemName = '';
            for (let i = 0; i < targetPlayer.items.length; i++) {
                const defenseItem = targetPlayer.items[i];
                if (defenseItem.name === '大瓶可尔思必' && player.role === '薰') {
                    // 大瓶可尔思必：只能防御来自薰的攻击
                    hasDefense = true;
                    defenseIndex = i;
                    defenseItemName = '大瓶可尔思必';
                    break;
                } else if (defenseItem.name === '念珠') {
                    // 念珠：可以防御任何来自其他人的攻击
                    hasDefense = true;
                    defenseIndex = i;
                    defenseItemName = '念珠';
                    break;
                }
            }
            
            if (hasDefense) {
                // 移除防御道具
                targetPlayer.items.splice(defenseIndex, 1);
                targetPlayer.cards = Math.max(0, targetPlayer.cards - 1);
                
                // 记录日志
                logEvent(`玩家${targetPlayerIndex + 1}（${targetPlayer.role}）使用${defenseItemName}抵御了杀害`);
                
                // 显示消息
                elements.gameMessage.textContent = `玩家${targetPlayerIndex + 1}（${targetPlayer.role}）使用${defenseItemName}抵御了杀害！`;
                
                // 如果使用念珠防御，且使用者不是薰或者水上，且行动点>=1，则扣除1行动点
                if (defenseItemName === '念珠' && targetPlayer.role !== '薰' && targetPlayer.role !== '水上' && targetPlayer.action >= 1) {
                    targetPlayer.action--;
                    logEvent(`玩家${targetPlayerIndex + 1}（${targetPlayer.role}）使用念珠抵御杀害，扣除1点行动点`);
                }
            } else {
                // 检查是否是特殊角色使用武器（不消耗行动点）
                let shouldConsumeAction = true;
                let actionLog = ``;
                
                switch (item.weaponType) {
                    case 'knife': // 军刀
                        if (player.role === '花泽') {
                            shouldConsumeAction = false;
                            actionLog = `（特殊：不消耗行动点）`;
                        }
                        break;
                    case 'gun': // 枪
                        if (player.role === '博士') {
                            shouldConsumeAction = false;
                            actionLog = `（特殊：不消耗行动点）`;
                        }
                        break;
                    case 'carving_knife': // 雕刻刀
                        if (player.role === '水上') {
                            shouldConsumeAction = false;
                            actionLog = `（特殊：不消耗行动点）`;
                        }
                        break;
                }
                
                // 消耗行动点 - 已在useItem函数中消耗，这里不再消耗
                if (shouldConsumeAction) {
                    logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}`);
                } else {
                    logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}${actionLog}`);
                }
                
                // 设置目标玩家为死亡
                targetPlayer.status = 'die';
                logEvent(`玩家${targetPlayerIndex + 1}（${targetPlayer.role}）被${item.name}杀死`);

                // 显示消息
                elements.gameMessage.textContent = `玩家${targetPlayerIndex + 1}（${targetPlayer.role}）已被${item.name}杀死！`;
            }
            
            // 更新UI
            updateUI();
            
            // 检查胜利条件
            checkWinCondition();
            
            // 处理行动后逻辑
            handlePostActionLogic(player, playerIndex);
        },
        () => {
            // 恢复行动点
            player.action++;
        }
    );
}

// 处理格子功能
function handleGridFunction() {
    const currentGrid = gridConfig[gameState.tokenPosition];
    const currentPlayer = gameState.players[gameState.currentPlayer];

    // 处理起点
    if (currentGrid.types.includes('start')) {
        elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}回到了起点！`;
        logEvent(`触发效果：玩家${gameState.currentPlayer + 1}回到了起点`);
    }

    // 使用策略模式处理格子效果
    const strategies = GridStrategyFactory.getStrategies(currentGrid);
    strategies.forEach(strategy => {
        strategy.execute(currentGrid, currentPlayer);
    });

    // 更新UI
    updateUI();

    // 检查胜利条件
    if (checkWinCondition()) {
        elements.rollDice.disabled = true;
        return;
    }

    // 处理行动后逻辑
    handlePostActionLogic(currentPlayer, gameState.currentPlayer);
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
        gameStateManager.setState('round', gameState.round + 1);
    }

    gameStateManager.setState('currentPlayer', nextPlayerIndex);
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
    if (currentPlayer.action === undefined || currentPlayer.action === null) {
        // 行动点未定义时，设置为初始值
        currentPlayer.action = characterAttributes[currentPlayer.role].action;
    } else if (currentPlayer.action === 0) {
        // 行动点为0时，自动回复1点
        currentPlayer.action = 1;
        actionMessage = '行动点自动回复1点，';
        logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）行动点为零，自动回复1点`);
    }
    // 行动点大于0时，保持不变（保留未使用的行动点）

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
    
    // 尝试重新加载角色配置
    await autoLoadRolesFromCSV();

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
    const actionPoints = Number(currentPlayer.action) || 0;
    if (actionPoints < 4) {
        elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}行动点不足4点，无法执行杀人操作！`;
        logEvent(`玩家${gameState.currentPlayer + 1}行动点不足4点，无法执行杀人操作`);
        return;
    }

    // 生成可选择的玩家列表
    const availablePlayers = [];
    for (let i = 0; i < gameState.players.length; i++) {
        if (i !== gameState.currentPlayer && gameState.players[i].status === 'alive' && !gameState.players[i].hasKeychain) {
            availablePlayers.push(i);
        }
    }

    if (availablePlayers.length === 0) {
        elements.gameMessage.textContent = '没有可选择的目标！';
        logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）尝试杀人，但没有可选择的目标`);
        return;
    }

    // 构建选择界面
    let killOptions = '';
    availablePlayers.forEach(targetIndex => {
        const targetPlayer = gameState.players[targetIndex];
        killOptions += `<div class="kill-item" data-target-player="${targetIndex}">玩家${targetIndex + 1}（${targetPlayer.role}）- 剩余行动点：${targetPlayer.action || 0}</div>`;
    });

    // 创建弹出框
    const killDialog = document.createElement('div');
    killDialog.className = 'kill-dialog';
    killDialog.innerHTML = `
        <div class="kill-dialog-content">
            <h3>选择要杀死的角色：</h3>
            <div class="kill-options">${killOptions}</div>
            <button class="cancel-kill">取消</button>
        </div>
    `;
    document.body.appendChild(killDialog);



    // 处理目标选择
    const killItems = killDialog.querySelectorAll('.kill-item');
    killItems.forEach(itemElement => {
        itemElement.addEventListener('click', () => {
            const targetPlayerIndex = parseInt(itemElement.dataset.targetPlayer);
            const targetPlayer = gameState.players[targetPlayerIndex];
            
            // 保存游戏状态
            saveGameState();

            // 消耗行动点 - 无论是否被防御，都应当扣除行动点
            currentPlayer.action -= 4;
            logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）消耗4点行动点执行杀人操作`);

            // 检查目标玩家是否持有防御道具
            let hasDefense = false;
            let defenseIndex = -1;
            let defenseItemName = '';
            for (let i = 0; i < targetPlayer.items.length; i++) {
                const item = targetPlayer.items[i];
                if (item.name === '大瓶可尔思必' && currentPlayer.role === '薰') {
                    // 大瓶可尔思必：只能防御来自薰的攻击
                    hasDefense = true;
                    defenseIndex = i;
                    defenseItemName = '大瓶可尔思必';
                    break;
                } else if (item.name === '念珠') {
                    // 念珠：可以防御任何来自其他人的攻击
                    hasDefense = true;
                    defenseIndex = i;
                    defenseItemName = '念珠';
                    break;
                }
            }

            if (hasDefense) {
                // 移除防御道具
                targetPlayer.items.splice(defenseIndex, 1);
                targetPlayer.cards = Math.max(0, targetPlayer.cards - 1);
                
                // 记录日志
                logEvent(`玩家${targetPlayerIndex + 1}（${targetPlayer.role}）使用${defenseItemName}抵御了杀害`);
                
                // 显示消息
                elements.gameMessage.textContent = `玩家${targetPlayerIndex + 1}（${targetPlayer.role}）使用${defenseItemName}抵御了杀害！`;
                
                // 如果使用念珠防御，且使用者不是薰或者水上，且行动点>=1，则扣除1行动点
                if (defenseItemName === '念珠' && targetPlayer.role !== '薰' && targetPlayer.role !== '水上' && targetPlayer.action >= 1) {
                    targetPlayer.action--;
                    logEvent(`玩家${targetPlayerIndex + 1}（${targetPlayer.role}）使用念珠抵御杀害，扣除1点行动点`);
                }
            } else {
                // 设置目标玩家为死亡
                targetPlayer.status = 'die';
                logEvent(`玩家${targetPlayerIndex + 1}（${targetPlayer.role}）被杀死`);

                // 显示消息
                elements.gameMessage.textContent = `玩家${targetPlayerIndex + 1}（${targetPlayer.role}）已被杀死！`;
            }
            
            // 关闭对话框
            document.body.removeChild(killDialog);
            
            // 检查胜利条件
            checkWinCondition();
            
            // 处理行动后逻辑
            handlePostActionLogic(currentPlayer, gameState.currentPlayer);
        });
    });

    // 处理取消按钮
    const cancelButton = killDialog.querySelector('.cancel-kill');
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(killDialog);
        document.head.removeChild(style);
    });
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
    const actionPoints = Number(currentPlayer.action) || 0;
    if (actionPoints < 1) {
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
    currentPlayer.action = Number(currentPlayer.action) || 0;
    currentPlayer.action--;
    logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）消耗1点行动点执行抽牌操作，剩余行动点：${currentPlayer.action}`);

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
    
    // 处理行动后逻辑
    handlePostActionLogic(currentPlayer, gameState.currentPlayer);
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
    // 订阅状态变化观察者
    gameStateManager.subscribe((data) => {
        console.log('状态变化:', data.path, '->', data.value);
        updateUI();
    });
    
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
    
    // 尝试自动加载角色配置
    const loadedRoles = await autoLoadRolesFromCSV();
    if (!loadedRoles) {
        console.log('角色配置加载失败，请确保role.csv文件存在且格式正确');
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