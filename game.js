// 道具配置（从CSV文件中加载）
let items = {};
let itemPool = [];

// 幻象技配置（从CSV文件中加载）
let fantasySkills = {};

// 地图格子配置（从CSV文件中加载）
let gridConfig = [];

// 解析道具CSV数据
function parseItemCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const parsedItems = {};
    const newItemPool = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');

        // 新的CSV格式：涉及好感度,涉及行动点,其他功能,序号,道具名,数量,道具描述
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
                } else if (name === '能面') {
                    item.type = 'mask';
                } else if (name === '金鱼花洒') {
                    item.type = 'goldfish_shower';
                } else if (name === '三文鱼罐头') {
                    item.type = 'salmon_can';
                } else if (name === '摄像机') {
                    item.type = 'camera';
                } else if (name === '话剧剧本') {
                    item.type = 'drama_script';
                } else if (name === '校帽') {
                    item.type = 'school_cap';
                } else if (name === '汽车') {
                    item.type = 'car';
                } else if (name === '眼镜') {
                    item.type = 'glasses';
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
            case '大复活术':
                if (name === '雨水') {
                    item.type = 'rain_water';
                } else if (name === '时光机') {
                    item.type = 'time_machine';
                }
                break;
            case '周目变动':
                if (name === '雨水') {
                    item.type = 'rain_water';
                }
                else if (name === '时光机') {
                    item.type = 'time_machine';
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

// 解析幻象技CSV数据
function parseFantasySkillCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const parsedSkills = {};

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const name = values[0];
        const description = values[1];

        const skill = {
            name: name,
            description: description
        };

        parsedSkills[name] = skill;
    }

    return parsedSkills;
}

// 解析地图CSV数据
function parseMapCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const newGridConfig = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const 涉及好感度 = values[0];
        const 功能分类 = values[1];
        const 所在格 = parseInt(values[2]);
        const 地点 = values[3];
        const 地点描述 = values[4];

        // 构建格子对象
        const grid = {
            name: 地点,
            id: 所在格,
            description: 地点描述,
            isSpecial: 功能分类 !== '无',
            types: [],
            isStagnant: 功能分类.includes('停滞'),
            道具Effect: null
        };

        // 处理功能分类
        if (功能分类.includes('交易') && grid.name !== '市营电车站') {
            grid.types.push('cards');
        }

        if (功能分类.includes('弃置')) {
            grid.types.push('cards');

        }

        if (功能分类.includes('新周目')) {
            grid.types.push('水洼');
        }

        // 处理好感度效果
        if (涉及好感度 === '是') {
            grid.favorEffect = {
                type: 'player',
                value: 10
            };

            // 根据地点设置特定角色的好感度效果
            switch (地点) {
                case '大泉家':
                    grid.favorEffect.type = 'role';
                    grid.favorEffect.role = '水上';
                    break;
                case '池田宅':
                    grid.favorEffect.type = 'role';
                    grid.favorEffect.role = '川濑';
                    break;
                case '花泽家':
                    grid.favorEffect.type = 'role';
                    grid.favorEffect.role = '花泽';
                    break;
                case '冰川宅':
                    grid.favorEffect.type = 'role';
                    grid.favorEffect.role = '博士';
                    break;
                case '梅钵堂':
                case '咖啡厅':
                    grid.favorEffect.type = 'all';
                    break;
                case '帝国大学':
                    // 帝国大学的好感度效果由掷骰子结果决定，移除默认好感度效果
                    grid.favorEffect = null;
                    break;
            }
        } else {
            grid.favorEffect = null;
        }

        // 处理起点
        if (所在格 === 1) {
            grid.types.push('start');
            grid.types.push('favor');
            // 梅钵堂格子特殊处理
            if (地点 === '梅钵堂') {
                grid.favorEffect = {
                    type: 'all',
                    value: 10
                };
            }
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

        // 检查是否至少载入了30个道具
        if (Object.keys(items).length === 0 || itemPool.length < 30) {
            console.error('加载道具失败: 至少需要载入30个道具');
            return false;
        }

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

// 加载幻象技CSV数据
function loadFantasySkillsFromCSV(csvText) {
    try {
        const parsedSkills = parseFantasySkillCSV(csvText);
        fantasySkills = parsedSkills;
        console.log('幻象技加载成功:', fantasySkills);
        return true;
    } catch (error) {
        console.error('加载幻象技失败:', error);
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

// 从文件读取幻象技CSV数据
function loadFantasySkillsFromFile() {
    const fileInput = document.getElementById('fantasy-skill-csv');
    const file = fileInput.files[0];

    if (!file) {
        alert('请先选择幻象技CSV文件！');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const csvText = e.target.result;
        const success = loadFantasySkillsFromCSV(csvText);
        if (success) {
            updateFantasySkillLoadStatus('已加载');
        } else {
            alert('幻象技加载失败，请检查CSV文件格式！');
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
            initialFavor: parseInt(values[4]),
            maxFantasySkills: parseInt(values[5]) || 0
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

// 尝试自动读取幻象技CSV文件
async function autoLoadFantasySkillsFromCSV() {
    try {
        const response = await fetch('fantasySkill.csv');
        if (!response.ok) {
            return false;
        }
        const csvText = await response.text();
        const success = loadFantasySkillsFromCSV(csvText);
        if (success) {
            updateFantasySkillLoadStatus('已加载');
            console.log('自动加载幻象技成功');
            return true;
        }
        return false;
    } catch (error) {
        console.log('自动加载幻象技失败，需要手动选择:', error);
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
        gridElement.dataset.description = grid.description || '';

        // 根据格子类型设置样式
        if (grid.types.includes('start')) {
            gridElement.classList.add('grid-start');
        } else if (grid.types.includes('favor')) {
            gridElement.classList.add('grid-favor');
        } else if (grid.types.includes('cards')) {
            gridElement.classList.add('grid-cards');
        } else if (grid.types.includes('stagnant')) {
            gridElement.classList.add('grid-stagnant');
        } else if (grid.types.includes('水洼')) {
            gridElement.classList.add('grid-water');
        }

        // 梅钵堂格子特殊样式 - 红色
        if (grid.name === '梅钵堂') {
            gridElement.classList.add('grid-meibutsu');
        }

        // 市营电车站格子特殊样式 - 草绿色
        if (grid.name === '市营电车站') {
            gridElement.classList.add('grid-station');
        } else if (grid.name === '机械汤' || grid.name === '水道桥' || grid.name === '咖啡厅' || grid.name === '电影院' || grid.name === '十二阶' || grid.name === '吾妻桥' || grid.name === '三千堂') {
            // 机械汤、水道桥、咖啡厅、电影院、十二阶、吾妻桥、三千堂格子特殊样式 - 灰色
            gridElement.classList.add('grid-mechanical-bath');
        } else if (grid.name === '大泉家' || grid.name === '池田宅' || grid.name === '帝国大学' || grid.name === '花泽家' || grid.name === '冰川宅') {
            // 大泉家、池田宅、帝国大学、花泽家、冰川宅格子特殊样式 - 淡橙色
            gridElement.classList.add('grid-residence');
        } else if (!grid.isSpecial && !grid.types.length) {
            // 普通格子样式 - 白色
            gridElement.classList.add('grid-normal');
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

// 更新幻象技加载状态显示
function updateFantasySkillLoadStatus(status) {
    const statusElement = document.getElementById('fantasy-skill-load-status');
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

    // 计算道具总数
    const currentItemCount = Object.values(itemCount).reduce((sum, count) => sum + count, 0);
    const initialItemCount = itemPool.length; // 初始道具数量 = 原始道具池长度

    // 创建道具池头部，包含总数展示和搜索框
    const itemPoolHeader = document.createElement('div');
    itemPoolHeader.className = 'item-pool-header';
    itemPoolHeader.innerHTML = `
        <div class="item-pool-stats">
            <span>初始道具数量: ${initialItemCount}</span>
            <span>当前剩余数量: ${currentItemCount}</span>
        </div>
        <div class="item-pool-search">
            <input type="text" id="item-search" placeholder="搜索道具...">
        </div>
    `;
    itemPoolContent.appendChild(itemPoolHeader);

    // 创建道具列表容器
    const itemPoolList = document.createElement('div');
    itemPoolList.className = 'item-pool-list';

    // 显示道具池内容
    if (Object.keys(itemCount).length === 0) {
        itemPoolList.innerHTML = '<p style="text-align: center; color: #666;">道具池已空</p>';
        itemPoolContent.appendChild(itemPoolList);
        return;
    }

    // 遍历道具并显示
    Object.keys(itemCount).forEach(itemName => {
        const item = items[itemName];
        if (item) {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-pool-item';
            itemElement.dataset.itemName = item.name.toLowerCase();
            itemElement.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="item-info">数量: ${itemCount[itemName]}</div>
                <div class="item-info">描述: ${item.description}</div>
                ${item.favor > 0 ? `<div class="item-info">好感度: +${item.favor}</div>` : ''}
                ${item.action > 0 ? `<div class="item-info">行动点: +${item.action}</div>` : ''}
            `;
            itemPoolList.appendChild(itemElement);
        }
    });

    itemPoolContent.appendChild(itemPoolList);

    // 添加搜索功能
    const searchInput = document.getElementById('item-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const itemElements = itemPoolList.querySelectorAll('.item-pool-item');
            itemElements.forEach(element => {
                const itemName = element.dataset.itemName;
                if (itemName.includes(searchTerm)) {
                    element.style.display = 'block';
                } else {
                    element.style.display = 'none';
                }
            });
        });
    }
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
            reverseDirection: false,
            logs: [] // 日志存储
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
    constructor() { }
    execute(player, playerIndex, item, itemIndex) { }
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

        // 记录行动点消耗
        logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);

        // 处理好感度和行动点
        if (player.role !== '薰' && player.role !== '店主') {
            // 非薰和非店主玩家：只增加好感度，不恢复行动点
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
            // 薰和店主玩家：只恢复行动点，不增加好感度
            if (item.action > 0) {
                player.action += item.action;
                // 记录日志
                logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}，获得了${item.action}点行动点`);
                // 显示消息
                elements.gameMessage.textContent = `玩家${playerIndex + 1}（${player.role}）使用了${item.name}，获得了${item.action}点行动点，移动到${newGrid.id}.${newGrid.name}！`;
            } else {
                // 记录移动日志
                logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}，从${oldGrid.id}.${oldGrid.name}移动到${newGrid.id}.${newGrid.name}`);
                // 显示消息
                elements.gameMessage.textContent = `玩家${playerIndex + 1}（${player.role}）使用了${item.name}，移动到${newGrid.id}.${newGrid.name}！`;
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
            // 处理道具取消
            handleItemCancel(player, playerIndex, item);
            return false;
        }

        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 记录行动点消耗
        logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);

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
            // 处理道具取消
            handleItemCancel(player, playerIndex, item);
            return false;
        }

        // 记录行动点消耗
        logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);

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
        // 过滤出除川濑外的其他存活玩家，且不包括有蛙男技能的玩家
        const availablePlayers = [];
        gameState.players.forEach((targetPlayer, targetIndex) => {
            if (targetIndex !== playerIndex && targetPlayer.status === 'alive' && targetPlayer.role !== '川濑' && targetPlayer.items.length > 0 && !targetPlayer.hasFrogManSkill) {
                availablePlayers.push(targetIndex);
            }
        });

        if (availablePlayers.length === 0) {
            elements.gameMessage.textContent = '没有可抢夺的目标！';
            logEvent(`玩家${playerIndex + 1}（${player.role}）尝试使用${item.name}，但没有可抢夺的目标`);
            // 处理道具取消
            handleItemCancel(player, playerIndex, item);
            return false;
        }

        // 使用GameDialogService创建抢夺道具对话框
        GameDialogService.createStealDialog(
            availablePlayers,
            (itemElement) => {
                const targetPlayerIndex = parseInt(itemElement.dataset.targetPlayer);
                const targetItemIndex = parseInt(itemElement.dataset.itemIndex);

                // 记录行动点消耗
                logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);

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
                // 处理道具取消
                handleItemCancel(player, playerIndex, item);
            }
        );
        return false; // 异步操作，不继续执行后续逻辑
    }
}

// 大瓶可尔必思道具策略
class ColspiceItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 记录行动点消耗
        logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);

        // 增加好感度或恢复行动点
        if (player.role !== '薰' && player.role !== '店主') {
            updateFavor(player, item.favor);
            // 记录日志
            logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}，增加了${item.favor}点好感度`);
            // 显示消息
            elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了${item.name}，增加了${item.favor}点好感度！`;
        } else {
            // 薰和店主无法获得好感度，而是恢复行动点
            player.action += item.action;
            // 记录日志
            logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}，获得了${item.action}点行动点`);
            // 显示消息
            elements.gameMessage.textContent = `玩家${playerIndex + 1}（${player.role}）使用了${item.name}，获得了${item.action}点行动点！`;
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

        // 记录行动点消耗
        logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);

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
                // 记录行动点消耗
                logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);

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
                // 记录行动点消耗
                logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);

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
        // 检查当前是否在市营电车站
        const currentGrid = gridConfig[gameState.tokenPosition];
        const isAtStation = currentGrid.name === '市营电车站';
        // 检查当前是否在机械汤格子上
        const isAtMechanicalBath = currentGrid.name === '机械汤';
        // 检查当前是否在咖啡厅格子上
        const isAtCoffeeShop = currentGrid.name === '咖啡厅';
        // 检查当前是否在电影院格子上
        const isAtCinema = currentGrid.name === '电影院';

        // 使用GameDialogService创建交换道具对话框
        GameDialogService.createExchangeDialog(
            (exchangeType) => {
                // 记录行动点消耗
                logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);

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

                        // 监控道具池状态
                        monitorItemPool();
                    } else {
                        elements.gameMessage.textContent = '道具池已空，无法抽取道具！';
                        logEvent(`玩家${playerIndex + 1}（${player.role}）尝试使用钱从牌堆抽取道具，但道具池已空`);
                        // 处理道具取消
                        handleItemCancel(player, playerIndex, item);
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
                        // 处理道具取消
                        handleItemCancel(player, playerIndex, item);
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
                            // 处理道具取消
                            handleItemCancel(player, playerIndex, item);
                        }
                    );
                } else if (exchangeType === 'station') {
                    // 搭乘电车
                    // 显示车站对话框
                    showStationDialog(player, playerIndex, itemIndex);
                } else if (exchangeType === 'bath') {
                    // 兑换洗浴券
                    // 从当前玩家的道具栏中移除钱（一次性道具）
                    player.items.splice(itemIndex, 1);
                    player.cards = Math.max(0, player.cards - 1);

                    // 添加洗浴券到玩家的道具数组
                    const bathTicket = items['洗浴券'];
                    if (bathTicket) {
                        player.items.push(bathTicket);
                        player.cards++;

                        // 记录日志
                        logEvent(`玩家${playerIndex + 1}（${player.role}）使用钱，兑换了洗浴券`);

                        // 显示消息
                        elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了钱，兑换了洗浴券！`;

                        // 处理行动后逻辑
                        handlePostActionLogic(player, playerIndex);
                    } else {
                        elements.gameMessage.textContent = '洗浴券不存在！';
                        logEvent(`玩家${playerIndex + 1}（${player.role}）尝试使用钱兑换洗浴券，但洗浴券不存在`);
                        // 处理道具取消
                        handleItemCancel(player, playerIndex, item);
                    }
                } else if (exchangeType === 'coffee') {
                    // 点餐
                    // 从当前玩家的道具栏中移除钱（一次性道具）
                    player.items.splice(itemIndex, 1);
                    player.cards = Math.max(0, player.cards - 1);

                    // 显示咖啡厅对话框
                    showCoffeeShopDialog();
                } else if (exchangeType === 'cinema') {
                    // 兑换电影票
                    // 从当前玩家的道具栏中移除钱（一次性道具）
                    player.items.splice(itemIndex, 1);
                    player.cards = Math.max(0, player.cards - 1);

                    // 添加电影票到玩家的道具数组
                    const movieTicket = items['电影票'];
                    if (movieTicket) {
                        player.items.push(movieTicket);
                        player.cards++;

                        // 记录日志
                        logEvent(`玩家${playerIndex + 1}（${player.role}）使用钱，兑换了电影票`);

                        // 显示消息
                        elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了钱，兑换了电影票！`;

                        // 处理行动后逻辑
                        handlePostActionLogic(player, playerIndex);
                    } else {
                        elements.gameMessage.textContent = '电影票不存在！';
                        logEvent(`玩家${playerIndex + 1}（${player.role}）尝试使用钱兑换电影票，但电影票不存在`);
                        // 处理道具取消
                        handleItemCancel(player, playerIndex, item);
                    }
                }
            },
            () => {
                // 处理道具取消
                handleItemCancel(player, playerIndex, item);
            },
            isAtStation, // 传递是否显示搭乘电车选项
            isAtMechanicalBath, // 传递是否显示兑换洗浴券选项
            isAtCoffeeShop, // 传递是否显示点餐选项
            isAtCinema // 传递是否显示兑换电影票选项
        );
        return false; // 异步操作，不继续执行后续逻辑
    }
}



// 武器道具策略
class WeaponItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 记录行动点消耗
        logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);

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

        // 记录行动点消耗
        logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);

        // 处理好感度和行动点
        if (player.role !== '薰' && player.role !== '店主') {
            // 非薰和非店主玩家：只增加好感度，不恢复行动点
            if (item.favor > 0) {
                updateFavor(player, item.favor);
                // 记录日志
                logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}，增加了${item.favor}点好感度`);
                // 显示消息
                elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了${item.name}，增加了${item.favor}点好感度！`;
            }
        } else {
            // 薰和店主玩家：只恢复行动点，不增加好感度
            if (item.action > 0) {
                player.action += item.action;
                // 记录日志
                logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}，获得了${item.action}点行动点`);
                // 显示消息
                elements.gameMessage.textContent = `玩家${playerIndex + 1}（${player.role}）使用了${item.name}，获得了${item.action}点行动点！`;
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

        // 记录行动点消耗
        logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);

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

// 金鱼花洒道具策略
class GoldfishShowerItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 记录行动点消耗
        logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);

        // 动态获取冰川宅范围内的格子
        const targetRange = [];
        gridConfig.forEach((grid, index) => {
            if (grid.name === '冰川宅') {
                targetRange.push(index);
            }
        });

        // 创建地图选择对话框
        this.createMapSelectionDialog(player, playerIndex, item, itemIndex, targetRange, '冰川宅');

        return false; // 不继续执行后续逻辑
    }

    // 创建地图选择对话框
    createMapSelectionDialog(player, playerIndex, item, itemIndex, targetRange, locationName) {
        // 创建弹出框
        const mapDialog = document.createElement('div');
        mapDialog.className = 'map-selection-dialog';

        // 从模板加载HTML内容
        const templatesIframe = document.getElementById('templates-iframe');
        let template = null;
        if (templatesIframe && templatesIframe.contentDocument) {
            template = templatesIframe.contentDocument.getElementById('map-selection-dialog-template');
        }
        if (!template) {
            template = document.getElementById('map-selection-dialog-template');
        }
        if (template) {
            let templateHTML = template.innerHTML;
            // 替换模板中的变量
            templateHTML = templateHTML.replace('{{locationName}}', locationName);
            mapDialog.innerHTML = templateHTML;
        }

        document.body.appendChild(mapDialog);

        // 绘制地图格子
        const selectionMap = mapDialog.querySelector('#selection-map');
        if (selectionMap) {
            gridConfig.forEach((grid, index) => {
                const isCurrent = index === gameState.tokenPosition;
                const isSelectable = targetRange.includes(index) && !isCurrent;
                const className = `map-grid-item grid-${index} ${isSelectable ? 'selectable' : 'unselectable'} ${isCurrent ? 'current' : ''}`;

                const gridElement = document.createElement('div');
                gridElement.className = className;
                if (isSelectable) {
                    gridElement.dataset.gridIndex = index;
                }
                gridElement.innerHTML = `
                    <div class="grid-id">${grid.id}</div>
                    <div class="grid-name">${grid.name}</div>
                `;
                selectionMap.appendChild(gridElement);
            });
        }

        // 处理格子选择
        const selectableItems = mapDialog.querySelectorAll('.map-grid-item.selectable');
        selectableItems.forEach(itemElement => {
            itemElement.addEventListener('click', () => {
                const targetGridIndex = parseInt(itemElement.dataset.gridIndex);
                const targetGrid = gridConfig[targetGridIndex];

                // 移动棋子
                const oldPosition = gameState.tokenPosition;
                const oldGrid = gridConfig[oldPosition];
                gameState.tokenPosition = targetGridIndex;
                updateTokenPosition();

                // 记录移动日志
                logEvent(`玩家${playerIndex + 1}（${player.role}）使用${item.name}，从${oldGrid.id}.${oldGrid.name}移动到${targetGrid.id}.${targetGrid.name}`);

                // 显示消息
                elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了${item.name}，移动到${targetGrid.id}.${targetGrid.name}！`;

                // 移除对话框
                document.body.removeChild(mapDialog);

                // 处理行动后逻辑
                handlePostActionLogic(player, playerIndex);

                // 处理新位置的格子功能
                setTimeout(() => {
                    handleGridFunction();
                }, 500);
            });
        });

        // 处理取消按钮
        const cancelButton = mapDialog.querySelector('.cancel-map-selection');
        cancelButton.addEventListener('click', () => {
            // 恢复道具
            player.items.push(item);
            player.cards++;
            // 移除对话框
            document.body.removeChild(mapDialog);
            // 恢复行动点（如果不是特殊角色）
            let shouldRestoreAction = true;
            if (item.name === '金鱼花洒' && player.role === '博士') {
                shouldRestoreAction = false;
            } else if (item.name === '三文鱼罐头' && player.role === '花泽') {
                shouldRestoreAction = false;
            } else if (item.name === '摄像机' && player.role === '水上') {
                shouldRestoreAction = false;
            } else if (item.name === '话剧剧本' && player.role === '川濑') {
                shouldRestoreAction = false;
            }
            if (shouldRestoreAction) {
                // 处理道具取消
                handleItemCancel(player, playerIndex, item);
            } else {
                // 记录取消使用道具的日志（特殊角色）
                logEvent(`玩家${playerIndex + 1}（${player.role}）取消使用${item.name}（特殊：不消耗行动点）`);
                // 显示消息
                elements.gameMessage.textContent = `玩家取消了道具使用，行动点不变！`;
            }
        });
    }
}

// 三文鱼罐头道具策略
class SalmonCanItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 记录行动点消耗
        logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);

        // 动态获取花泽家范围内的格子
        const targetRange = [];
        gridConfig.forEach((grid, index) => {
            if (grid.name === '花泽家') {
                targetRange.push(index);
            }
        });

        // 创建地图选择对话框
        const goldfishStrategy = new GoldfishShowerItemStrategy();
        goldfishStrategy.createMapSelectionDialog(player, playerIndex, item, itemIndex, targetRange, '花泽家');

        return false; // 不继续执行后续逻辑
    }
}

// 摄像机道具策略
class CameraItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 记录行动点消耗
        logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);

        // 动态获取大泉家范围内的格子
        const targetRange = [];
        gridConfig.forEach((grid, index) => {
            if (grid.name === '大泉家') {
                targetRange.push(index);
            }
        });

        // 创建地图选择对话框
        const goldfishStrategy = new GoldfishShowerItemStrategy();
        goldfishStrategy.createMapSelectionDialog(player, playerIndex, item, itemIndex, targetRange, '大泉家');

        return false; // 不继续执行后续逻辑
    }
}

// 话剧剧本道具策略
class DramaScriptItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 记录行动点消耗
        logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);

        // 动态获取池田宅范围内的格子
        const targetRange = [];
        gridConfig.forEach((grid, index) => {
            if (grid.name === '池田宅') {
                targetRange.push(index);
            }
        });

        // 创建地图选择对话框
        const goldfishStrategy = new GoldfishShowerItemStrategy();
        goldfishStrategy.createMapSelectionDialog(player, playerIndex, item, itemIndex, targetRange, '池田宅');

        return false; // 不继续执行后续逻辑
    }
}

// 校帽道具策略
class SchoolCapItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 记录行动点消耗
        logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用道具，剩余行动点：${player.action}`);

        // 动态获取帝国大学范围内的格子
        const targetRange = [];
        gridConfig.forEach((grid, index) => {
            if (grid.name === '帝国大学') {
                targetRange.push(index);
            }
        });

        // 创建地图选择对话框
        const goldfishStrategy = new GoldfishShowerItemStrategy();
        goldfishStrategy.createMapSelectionDialog(player, playerIndex, item, itemIndex, targetRange, '帝国大学');

        return false; // 不继续执行后续逻辑
    }
}

// 汽车道具策略
class CarItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 确保行动点是数字类型
        player.action = Number(player.action) || 0;

        // 检查行动点是否足够
        if (player.action < 2) {
            elements.gameMessage.textContent = `行动点不足，无法使用汽车！`;
            logEvent(`玩家${playerIndex + 1}（${player.role}）尝试使用汽车，但行动点不足`);
            return false;
        }

        // 消耗行动点
        player.action -= 2;
        logEvent(`玩家${playerIndex + 1}（${player.role}）消耗2点行动点使用汽车，剩余行动点：${player.action}`);

        // 弹出掷骰子对话框
        this.createCarDialog(player, playerIndex, item, itemIndex);

        return false; // 不继续执行后续逻辑
    }

    // 创建汽车道具对话框
    createCarDialog(player, playerIndex, item, itemIndex) {
        // 创建弹出框
        const dialog = document.createElement('div');
        dialog.className = 'car-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>使用汽车</h3>
                <p>点击按钮掷骰子，移动点数 × 3</p>
                <button class="roll-dice-button">掷骰子</button>
                <div class="dice-result" style="margin-top: 10px;">骰子结果：-</div>
                <div class="confirm-section" style="display: none; margin-top: 10px;">
                    <p>本次点数为 <span class="final-dice-result">-</span>，是否确认移动？</p>
                    <button class="confirm-button">确认</button>
                    <button class="cancel-button">取消</button>
                </div>
            </div>
        `;

        // 添加居中样式
        const style = document.createElement('style');
        style.textContent = `
            .car-dialog {
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
            .car-dialog .dialog-content {
                background-color: white;
                padding: 20px;
                border-radius: 5px;
                width: 80%;
                max-width: 400px;
                text-align: center;
            }
            .car-dialog button {
                margin: 10px;
                padding: 8px 16px;
                font-size: 14px;
                font-weight: normal;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                min-width: 80px;
            }
            .car-dialog .roll-dice-button,
            .car-dialog .confirm-button {
                background-color: #4CAF50;
                color: white;
            }
            .car-dialog .roll-dice-button:hover,
            .car-dialog .confirm-button:hover {
                background-color: #45a049;
            }
            .car-dialog .cancel-button {
                background-color: #f44336;
                color: white;
            }
            .car-dialog .cancel-button:hover {
                background-color: #da190b;
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(dialog);

        // 处理掷骰子按钮
        const rollDiceButton = dialog.querySelector('.roll-dice-button');
        const diceResultElement = dialog.querySelector('.dice-result');
        const confirmSection = dialog.querySelector('.confirm-section');
        const finalDiceResultElement = dialog.querySelector('.final-dice-result');
        const confirmButton = dialog.querySelector('.confirm-button');
        const cancelButton = dialog.querySelector('.cancel-button');

        rollDiceButton.addEventListener('click', () => {
            // 掷骰子（1-6）
            const diceRoll = Math.floor(Math.random() * 6) + 1;
            const finalSteps = diceRoll * 3;

            diceResultElement.textContent = `骰子结果：${diceRoll}，将移动 ${finalSteps} 步`;
            finalDiceResultElement.textContent = diceRoll;

            // 显示确认按钮（博士和非博士都显示，但是非博士没有取消按钮）
            confirmSection.style.display = 'block';
            rollDiceButton.style.display = 'none';

            // 如果是非博士角色，隐藏取消按钮
            if (player.role !== '博士') {
                cancelButton.style.display = 'none';
                confirmButton.style.margin = '10px auto';
            }
        });

        // 处理确认按钮（博士和非博士角色都适用）
        confirmButton.addEventListener('click', () => {
            const diceRoll = parseInt(finalDiceResultElement.textContent);
            this.movePlayer(player, playerIndex, item, itemIndex, diceRoll);
            document.body.removeChild(dialog);
        });

        // 处理取消按钮（仅博士角色）
        cancelButton.addEventListener('click', () => {
            // 确保行动点是数字类型并返还
            player.action = Number(player.action) || 0;
            player.action += 2;
            // 记录取消使用道具的日志
            logEvent(`玩家${playerIndex + 1}（${player.role}）取消使用汽车，行动点不变`);
            // 显示消息
            elements.gameMessage.textContent = `玩家取消了道具使用，行动点不变！`;
            document.body.removeChild(dialog);
        });
    }

    // 移动玩家
    movePlayer(player, playerIndex, item, itemIndex, diceRoll) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 计算移动步数
        const steps = diceRoll * 3;

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

        // 检查是否离开起点（梅钵堂）
        if (oldGrid.name === '梅钵堂' && newGrid.name !== '梅钵堂') {
            gameState.hasLeftStart = true;
        }

        // 记录移动日志
        logEvent(`玩家${playerIndex + 1}（${player.role}）使用汽车，掷出${diceRoll}点，移动了${steps}步，从${oldGrid.id}.${oldGrid.name}移动到${newGrid.id}.${newGrid.name}${gameState.reverseDirection ? '（逆转方向）' : ''}`);

        // 显示消息
        elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了汽车，掷出${diceRoll}点，移动了${steps}步到${newGrid.id}.${newGrid.name}！`;

        // 处理行动后逻辑
        handlePostActionLogic(player, playerIndex);

        // 处理新位置的格子功能
        setTimeout(() => {
            handleGridFunction();
        }, 500);
    }
}

// 眼镜道具策略
class GlassesItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 确保行动点是数字类型
        player.action = Number(player.action) || 0;

        // 检查行动点是否足够
        if (player.action < 1) {
            elements.gameMessage.textContent = `行动点不足，无法使用眼镜！`;
            logEvent(`玩家${playerIndex + 1}（${player.role}）尝试使用眼镜，但行动点不足`);
            return false;
        }

        // 消耗行动点
        player.action -= 1;
        logEvent(`玩家${playerIndex + 1}（${player.role}）消耗1点行动点使用眼镜，剩余行动点：${player.action}`);

        // 过滤出符合条件的玩家，不包括有蛙男技能的玩家
        const availablePlayers = [];
        gameState.players.forEach((targetPlayer, targetIndex) => {
            if (targetIndex !== playerIndex && targetPlayer.status === 'alive' && (Number(targetPlayer.action) || 0) > 0 && !targetPlayer.hasFrogManSkill) {
                availablePlayers.push({ index: targetIndex, player: targetPlayer });
            }
        });

        if (availablePlayers.length === 0) {
            elements.gameMessage.textContent = `没有符合条件的玩家可以掷骰子！`;
            logEvent(`玩家${playerIndex + 1}（${player.role}）使用眼镜，但没有符合条件的玩家`);
            // 处理道具取消
            handleItemCancel(player, playerIndex, item);
            return false;
        }

        // 弹出眼镜道具对话框
        this.createGlassesDialog(player, playerIndex, item, itemIndex, availablePlayers);

        return false; // 不继续执行后续逻辑
    }

    // 创建眼镜道具对话框
    createGlassesDialog(player, playerIndex, item, itemIndex, availablePlayers) {
        // 创建弹出框
        const dialog = document.createElement('div');
        dialog.className = 'glasses-dialog';

        // 构建对话框内容
        let dialogContent = `
            <div class="dialog-content">
                <h3>使用眼镜</h3>
                <p>强制其他存活且拥有行动点的角色玩家依次掷骰子</p>
                <div class="total-result" style="margin: 15px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; text-align: center;">
                    <strong>骰子点数总和：</strong><span class="total-dice">0</span>
                </div>
                <div class="players-list">
        `;

        // 添加每个玩家的信息和按钮
        availablePlayers.forEach(({ index, player: targetPlayer }) => {
            dialogContent += `
                <div class="player-item" data-player-index="${index}">
                    <div class="player-info">
                        <div>玩家${index + 1}（${targetPlayer.role}）</div>
                        <div>行动点：<span class="action-points">${Number(targetPlayer.action) || 0}</span></div>
                    </div>
                    <button class="roll-dice-button" data-player-index="${index}">掷骰子 (消耗1行动点)</button>
                    <div class="dice-result" style="margin-top: 5px; display: none;">骰子结果：-</div>
                </div>
            `;
        });

        dialogContent += `
                </div>
                <button class="close-button" style="display: none; margin-top: 20px;">关闭</button>
            </div>
        `;

        dialog.innerHTML = dialogContent;

        // 添加居中样式
        const style = document.createElement('style');
        style.textContent = `
            .glasses-dialog {
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
            .glasses-dialog .dialog-content {
                background-color: white;
                padding: 20px;
                border-radius: 5px;
                width: 80%;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
            }
            .glasses-dialog .players-list {
                margin-top: 20px;
            }
            .glasses-dialog .player-item {
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 10px;
                margin-bottom: 10px;
            }
            .glasses-dialog .player-info {
                margin-bottom: 10px;
            }
            .glasses-dialog .total-result {
                font-size: 16px;
                background-color: #f9f9f9;
            }
            .glasses-dialog button {
                margin: 5px;
                padding: 8px 16px;
                font-size: 14px;
                font-weight: normal;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                min-width: 120px;
            }
            .glasses-dialog .roll-dice-button {
                background-color: #4CAF50;
                color: white;
            }
            .glasses-dialog .roll-dice-button:hover {
                background-color: #45a049;
            }
            .glasses-dialog .close-button {
                background-color: #2196F3;
                color: white;
            }
            .glasses-dialog .close-button:hover {
                background-color: #0b7dda;
            }
            .glasses-dialog .roll-dice-button:disabled {
                background-color: #cccccc;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(dialog);

        // 处理掷骰子按钮
        const rollDiceButtons = dialog.querySelectorAll('.roll-dice-button');
        const closeButton = dialog.querySelector('.close-button');
        const totalDiceElement = dialog.querySelector('.total-dice');
        let rolledPlayers = 0;
        let totalDice = 0;
        const diceResults = {}; // 存储每个玩家的骰子结果

        rollDiceButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetPlayerIndex = parseInt(button.dataset.playerIndex);
                const targetPlayer = gameState.players[targetPlayerIndex];
                const playerItem = button.closest('.player-item');
                const diceResultElement = playerItem.querySelector('.dice-result');
                const actionPointsElement = playerItem.querySelector('.action-points');

                // 消耗目标玩家的行动点
                targetPlayer.action = Number(targetPlayer.action) || 0;
                targetPlayer.action -= 1;
                actionPointsElement.textContent = targetPlayer.action;

                // 掷骰子（1-6）
                const diceRoll = Math.floor(Math.random() * 6) + 1;
                diceResultElement.textContent = `骰子结果：${diceRoll}`;
                diceResultElement.style.display = 'block';

                // 存储骰子结果并更新总和
                diceResults[targetPlayerIndex] = diceRoll;
                totalDice += diceRoll;
                totalDiceElement.textContent = totalDice;

                // 禁用按钮
                button.disabled = true;
                button.textContent = '已掷骰子';

                // 增加已掷骰子的玩家数量
                rolledPlayers++;

                // 检查是否所有玩家都已掷骰子
                if (rolledPlayers === availablePlayers.length) {
                    // 所有玩家都已掷骰子，计算总和并移动棋子
                    this.moveToken(player, playerIndex, totalDice);

                    // 1秒后显示关闭按钮
                    setTimeout(() => {
                        closeButton.style.display = 'block';
                    }, 1000);
                }
            });
        });

        // 处理关闭按钮
        closeButton.addEventListener('click', () => {
            // 从道具列表中移除
            player.items.splice(itemIndex, 1);
            player.cards = Math.max(0, player.cards - 1);

            // 显示消息
            elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了眼镜，强制其他玩家掷骰子！`;

            // 处理行动后逻辑
            handlePostActionLogic(player, playerIndex);

            // 处理当前位置的格子功能
            setTimeout(() => {
                handleGridFunction();
            }, 500);

            document.body.removeChild(dialog);
        });
    }

    // 移动棋子
    moveToken(player, playerIndex, diceRoll) {
        // 移动棋子
        const oldPosition = gameState.tokenPosition;
        const oldGrid = gridConfig[oldPosition];
        if (gameState.reverseDirection) {
            // 逆转方向移动
            gameState.tokenPosition = (gameState.tokenPosition - diceRoll + 52) % 52;
        } else {
            // 正常方向移动
            gameState.tokenPosition = (gameState.tokenPosition + diceRoll) % 52;
        }
        const newGrid = gridConfig[gameState.tokenPosition];
        updateTokenPosition();

        // 检查是否离开起点（梅钵堂）
        if (oldGrid.name === '梅钵堂' && newGrid.name !== '梅钵堂') {
            gameState.hasLeftStart = true;
        }

        // 记录移动日志
        logEvent(`玩家${playerIndex + 1}（${player.role}）使用眼镜，强制其他玩家掷出总和${diceRoll}点，从${oldGrid.id}.${oldGrid.name}移动到${newGrid.id}.${newGrid.name}${gameState.reverseDirection ? '（逆转方向）' : ''}`);

        // 显示消息
        elements.gameMessage.textContent = `玩家${playerIndex + 1}使用眼镜，强制其他玩家掷出总和${diceRoll}点，移动到${newGrid.id}.${newGrid.name}！`;
    }
}

// 能面道具策略
class MaskItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 动态获取不影响好感度的任意区域的格子
        const targetRange = [];
        gridConfig.forEach((grid, index) => {
            if (!grid.favorEffect) {
                targetRange.push(index);
            }
        });

        // 创建地图选择对话框
        const goldfishStrategy = new GoldfishShowerItemStrategy();
        goldfishStrategy.createMapSelectionDialog(player, playerIndex, item, itemIndex, targetRange, '不影响好感度的区域');

        return false; // 不继续执行后续逻辑
    }
}

// 七味粉道具策略
class SevenSpiceItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 检查场上是否有存活的花泽角色玩家
        let hasAliveHanazawa = false;
        gameState.players.forEach((targetPlayer, targetIndex) => {
            if (targetPlayer.role === '花泽' && targetPlayer.status === 'alive') {
                // 使花泽角色玩家的好感下降10
                updateFavor(targetPlayer, -10);
                hasAliveHanazawa = true;
                logEvent(`玩家${playerIndex + 1}（${player.role}）使用七味粉，使玩家${targetIndex + 1}（花泽）的好感下降10点`);
            }
        });

        if (hasAliveHanazawa) {
            // 显示消息
            elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了七味粉，使所有存活的花泽角色玩家的好感下降10点！`;
        } else {
            // 场上没有存活的花泽角色玩家，好感度降低不生效
            elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了七味粉，但场上没有存活的花泽角色玩家，好感度降低不生效！`;
            logEvent(`玩家${playerIndex + 1}（${player.role}）使用七味粉，但场上没有存活的花泽角色玩家`);
        }

        // 处理行动后逻辑
        handlePostActionLogic(player, playerIndex);

        return false; // 不继续执行后续逻辑
    }
}

// 《白发小僧》道具策略
class WhiteHairedMonkItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 检查场上是否有存活的水上角色玩家
        let hasAliveMizukami = false;
        gameState.players.forEach((targetPlayer, targetIndex) => {
            if (targetPlayer.role === '水上' && targetPlayer.status === 'alive') {
                // 使水上角色玩家的好感下降10
                updateFavor(targetPlayer, -10);
                hasAliveMizukami = true;
                logEvent(`玩家${playerIndex + 1}（${player.role}）使用《白发小僧》，使玩家${targetIndex + 1}（水上）的好感下降10点`);
            }
        });

        if (hasAliveMizukami) {
            // 显示消息
            elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了《白发小僧》，使所有存活的水上角色玩家的好感下降10点！`;
        } else {
            // 场上没有存活的水上角色玩家，好感度降低不生效
            elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了《白发小僧》，但场上没有存活的水上角色玩家，好感度降低不生效！`;
            logEvent(`玩家${playerIndex + 1}（${player.role}）使用《白发小僧》，但场上没有存活的水上角色玩家`);
        }

        // 处理行动后逻辑
        handlePostActionLogic(player, playerIndex);

        return false; // 不继续执行后续逻辑
    }
}

// 《幽灵塔》道具策略
class GhostTowerItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 检查场上是否有存活的川濑角色玩家
        let hasAliveKawase = false;
        gameState.players.forEach((targetPlayer, targetIndex) => {
            if (targetPlayer.role === '川濑' && targetPlayer.status === 'alive') {
                // 使川濑角色玩家的好感下降10
                updateFavor(targetPlayer, -10);
                hasAliveKawase = true;
                logEvent(`玩家${playerIndex + 1}（${player.role}）使用《幽灵塔》，使玩家${targetIndex + 1}（川濑）的好感下降10点`);
            }
        });

        if (hasAliveKawase) {
            // 显示消息
            elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了《幽灵塔》，使所有存活的川濑角色玩家的好感下降10点！`;
        } else {
            // 场上没有存活的川濑角色玩家，好感度降低不生效
            elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了《幽灵塔》，但场上没有存活的川濑角色玩家，好感度降低不生效！`;
            logEvent(`玩家${playerIndex + 1}（${player.role}）使用《幽灵塔》，但场上没有存活的川濑角色玩家`);
        }

        // 处理行动后逻辑
        handlePostActionLogic(player, playerIndex);

        return false; // 不继续执行后续逻辑
    }
}

// 《阁楼里的两位处女》道具策略
class TwoVirginsItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 检查场上是否有存活的博士角色玩家
        let hasAliveDoctor = false;
        gameState.players.forEach((targetPlayer, targetIndex) => {
            if (targetPlayer.role === '博士' && targetPlayer.status === 'alive') {
                // 使博士角色玩家的好感下降10
                updateFavor(targetPlayer, -10);
                hasAliveDoctor = true;
                logEvent(`玩家${playerIndex + 1}（${player.role}）使用《阁楼里的两位处女》，使玩家${targetIndex + 1}（博士）的好感下降10点`);
            }
        });

        if (hasAliveDoctor) {
            // 显示消息
            elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了《阁楼里的两位处女》，使所有存活的博士角色玩家的好感下降10点！`;
        } else {
            // 场上没有存活的博士角色玩家，好感度降低不生效
            elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了《阁楼里的两位处女》，但场上没有存活的博士角色玩家，好感度降低不生效！`;
            logEvent(`玩家${playerIndex + 1}（${player.role}）使用《阁楼里的两位处女》，但场上没有存活的博士角色玩家`);
        }

        // 处理行动后逻辑
        handlePostActionLogic(player, playerIndex);

        return false; // 不继续执行后续逻辑
    }
}

// 《脑髓地狱》道具策略
class BrainHellItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 获取所有存活的A类玩家
        const alivePlayers = [];
        gameState.players.forEach((targetPlayer, targetIndex) => {
            if (targetPlayer.status === 'alive' && targetPlayer.type === 'A') {
                alivePlayers.push({ index: targetIndex, player: targetPlayer });
            }
        });

        if (alivePlayers.length === 0) {
            // 场上没有存活的A类玩家，好感度降低不生效
            elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了《脑髓地狱》，但场上没有存活的A类玩家，好感度降低不生效！`;
            logEvent(`玩家${playerIndex + 1}（${player.role}）使用《脑髓地狱》，但场上没有存活的A类玩家`);
            // 处理行动后逻辑
            handlePostActionLogic(player, playerIndex);
            return false;
        }

        // 创建选择玩家的弹窗
        this.createPlayerSelectionDialog(player, playerIndex, item, itemIndex, alivePlayers);

        return false; // 不继续执行后续逻辑
    }

    // 创建玩家选择弹窗
    createPlayerSelectionDialog(player, playerIndex, item, itemIndex, alivePlayers) {
        // 创建弹窗
        const dialog = document.createElement('div');
        dialog.className = 'brain-hell-dialog';

        // 构建玩家选择界面
        let dialogContent = '<div class="brain-hell-content">';
        dialogContent += '<h3>选择要降低好感度的角色：</h3>';
        dialogContent += '<div class="player-list">';

        alivePlayers.forEach(({ index, player: targetPlayer }) => {
            dialogContent += `<div class="player-option" data-player-index="${index}">`;
            dialogContent += `<div class="player-info">`;
            dialogContent += `<div class="player-name">玩家${index + 1}（${targetPlayer.role}）</div>`;
            dialogContent += `<div class="player-favor">当前好感度：${targetPlayer.role === '薰' ? '???' : targetPlayer.favor}</div>`;
            dialogContent += `</div>`;
            dialogContent += `</div>`;
        });

        dialogContent += '</div>';
        dialogContent += '<div class="dialog-footer">';
        dialogContent += '<button class="cancel-button">取消</button>';
        dialogContent += '</div>';
        dialogContent += '</div>';

        dialog.innerHTML = dialogContent;
        document.body.appendChild(dialog);

        // 处理玩家选择
        const playerOptions = dialog.querySelectorAll('.player-option');
        playerOptions.forEach(option => {
            option.addEventListener('click', () => {
                const targetPlayerIndex = parseInt(option.dataset.playerIndex);
                const targetPlayer = gameState.players[targetPlayerIndex];

                // 使目标玩家的好感下降10
                updateFavor(targetPlayer, -10);

                // 记录日志
                logEvent(`玩家${playerIndex + 1}（${player.role}）使用《脑髓地狱》，使玩家${targetPlayerIndex + 1}（${targetPlayer.role}）的好感下降10点`);

                // 显示消息
                elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了《脑髓地狱》，使玩家${targetPlayerIndex + 1}（${targetPlayer.role}）的好感下降10点！`;

                // 移除对话框
                document.body.removeChild(dialog);

                // 处理行动后逻辑
                handlePostActionLogic(player, playerIndex);
            });
        });

        // 处理取消按钮
        const cancelButton = dialog.querySelector('.cancel-button');
        cancelButton.addEventListener('click', () => {
            // 恢复道具
            player.items.push(item);
            player.cards++;
            // 移除对话框
            document.body.removeChild(dialog);
            // 处理道具取消
            handleItemCancel(player, playerIndex, item);
        });
    }
}

// 雨水道具策略
class RainWaterItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 进入新周目，参见地图水洼规则，但不算水洼次数
        elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了雨水，原地进入新周目！`;
        logEvent(`触发效果：玩家${playerIndex + 1}（${player.role}）使用雨水，原地进入新周目`);

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

        // 立即更新UI
        updateUI();

        // 结束当前玩家的行动
        endTurn();

        return false; // 不继续执行后续逻辑
    }
}

// 时光机道具策略
class TimeMachineItemStrategy extends ItemStrategy {
    execute(player, playerIndex, item, itemIndex) {
        // 从道具列表中移除
        player.items.splice(itemIndex, 1);
        player.cards = Math.max(0, player.cards - 1);

        // 进入新周目，效果同雨水一样
        elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了时光机，原地进入新周目！`;
        logEvent(`触发效果：玩家${playerIndex + 1}（${player.role}）使用时光机，原地进入新周目`);

        // 周目+1
        gameState.week++;

        // 移动方向逆转
        gameState.reverseDirection = !gameState.reverseDirection;

        // 重置所有人的行动点为初始行动点
        gameState.players.forEach((targetPlayer, index) => {
            targetPlayer.action = characterAttributes[targetPlayer.role].action;
            // 重置钥匙串效果
            targetPlayer.hasKeychain = false;
            // 如果玩家死亡，复活并重置好感度
            if (targetPlayer.status === 'die') {
                targetPlayer.status = 'alive';
                targetPlayer.favor = characterAttributes[targetPlayer.role].initialFavor;
                logEvent(`玩家${index + 1}（${targetPlayer.role}）被复活，好感度重置为初始值`);
            }
            // 将本玩家之外的、存活的玩家的好感度重置为角色初始值
            if (index !== playerIndex && targetPlayer.status === 'alive') {
                targetPlayer.favor = characterAttributes[targetPlayer.role].initialFavor;
                logEvent(`玩家${index + 1}（${targetPlayer.role}）的好感度重置为初始值`);
            }
        });

        // 使用者恢复所有行动点
        player.action = characterAttributes[player.role].action;
        logEvent(`玩家${playerIndex + 1}（${player.role}）恢复了所有行动点`);

        // 如果使用者手持道具数量未达到道具上限，则从卡池内获取道具卡
        const maxCards = characterAttributes[player.role].maxCards;
        while (player.cards < maxCards && gameState.itemPool.length > 0) {
            const randomIndex = Math.floor(Math.random() * gameState.itemPool.length);
            const itemName = gameState.itemPool[randomIndex];
            const newItem = items[itemName];

            // 从道具池中移除该道具
            gameState.itemPool.splice(randomIndex, 1);

            // 添加道具到玩家的道具数组
            player.items.push(newItem);
            player.cards++;

            logEvent(`玩家${playerIndex + 1}（${player.role}）从卡池获取了道具${newItem.name}`);
        }

        // 立即更新UI
        updateUI();

        // 创建地图选择对话框，可让棋子移动至任何位置
        this.createTimeMachineMapSelectionDialog(player, playerIndex, item, itemIndex);

        return false; // 不继续执行后续逻辑
    }

    // 创建时光机专用地图选择对话框
    createTimeMachineMapSelectionDialog(player, playerIndex, item, itemIndex) {
        // 创建弹出框
        const mapDialog = document.createElement('div');
        mapDialog.className = 'map-selection-dialog';

        // 从模板加载HTML内容
        const templatesIframe = document.getElementById('templates-iframe');
        let template = null;
        if (templatesIframe && templatesIframe.contentDocument) {
            template = templatesIframe.contentDocument.getElementById('map-selection-dialog-template');
        }
        if (!template) {
            template = document.getElementById('map-selection-dialog-template');
        }
        if (template) {
            let templateHTML = template.innerHTML;
            // 替换模板中的变量
            templateHTML = templateHTML.replace('{{locationName}}', '任意位置');
            mapDialog.innerHTML = templateHTML;
        }

        document.body.appendChild(mapDialog);

        // 绘制地图格子
        const selectionMap = mapDialog.querySelector('#selection-map');
        if (selectionMap) {
            gridConfig.forEach((grid, index) => {
                const isCurrent = index === gameState.tokenPosition;
                const isWater = grid.types.includes('水洼');
                const isSelectable = !isCurrent && !isWater;
                const className = `map-grid-item grid-${index} ${isSelectable ? 'selectable' : 'unselectable'} ${isCurrent ? 'current' : ''}`;

                const gridElement = document.createElement('div');
                gridElement.className = className;
                if (isSelectable) {
                    gridElement.dataset.gridIndex = index;
                }
                gridElement.innerHTML = `
                    <div class="grid-id">${grid.id}</div>
                    <div class="grid-name">${grid.name}</div>
                `;
                selectionMap.appendChild(gridElement);
            });
        }

        // 处理格子选择
        const selectableItems = mapDialog.querySelectorAll('.map-grid-item.selectable');
        selectableItems.forEach(itemElement => {
            itemElement.addEventListener('click', () => {
                const targetGridIndex = parseInt(itemElement.dataset.gridIndex);
                const targetGrid = gridConfig[targetGridIndex];

                // 移动棋子
                const oldPosition = gameState.tokenPosition;
                const oldGrid = gridConfig[oldPosition];
                gameState.tokenPosition = targetGridIndex;
                updateTokenPosition();

                // 记录移动日志
                logEvent(`玩家${playerIndex + 1}（${player.role}）使用时光机，从${oldGrid.id}.${oldGrid.name}移动到${targetGrid.id}.${targetGrid.name}`);

                // 显示消息
                elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了时光机，移动到${targetGrid.id}.${targetGrid.name}！`;

                // 移除对话框
                document.body.removeChild(mapDialog);

                // 处理行动后逻辑
                handlePostActionLogic(player, playerIndex);

                // 处理新位置的格子功能
                setTimeout(() => {
                    handleGridFunction();
                }, 500);

                // 结束当前玩家的行动（博士使用时光机后不会自动结束行动）
                if (player.role !== '博士') {
                    setTimeout(() => {
                        endTurn();
                    }, 1000);
                }
            });
        });

        // 处理取消按钮
        const cancelButton = mapDialog.querySelector('.cancel-map-selection');
        cancelButton.addEventListener('click', () => {
            // 显示确认对话框
            if (confirm('确认不移动棋子？')) {
                // 移除对话框
                document.body.removeChild(mapDialog);
                // 显示消息
                elements.gameMessage.textContent = `玩家${playerIndex + 1}放弃了移动棋子！`;
                // 处理行动后逻辑
                handlePostActionLogic(player, playerIndex);
                // 处理当前位置的格子功能
                setTimeout(() => {
                    handleGridFunction();
                }, 500);
                // 结束当前玩家的行动（博士使用时光机后不会自动结束行动）
                if (player.role !== '博士') {
                    setTimeout(() => {
                        endTurn();
                    }, 1000);
                }
            }
        });
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
    'time_machine': TimeMachineItemStrategy,
    'keychain': KeychainItemStrategy,
    'silver_watch': SilverWatchItemStrategy,
    'notebook': NotebookItemStrategy,
    'goldfish_shower': GoldfishShowerItemStrategy,
    'salmon_can': SalmonCanItemStrategy,
    'camera': CameraItemStrategy,
    'drama_script': DramaScriptItemStrategy,
    'school_cap': SchoolCapItemStrategy,
    'car': CarItemStrategy,
    'glasses': GlassesItemStrategy,
    'mask': MaskItemStrategy,
    'seven_spice': SevenSpiceItemStrategy,
    'white_haired_monk': WhiteHairedMonkItemStrategy,
    'ghost_tower': GhostTowerItemStrategy,
    'two_virgins': TwoVirginsItemStrategy,
    'brain_hell': BrainHellItemStrategy,
    'rain_water': RainWaterItemStrategy
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
    '笔记本': 'notebook',
    '金鱼花洒': 'goldfish_shower',
    '三文鱼罐头': 'salmon_can',
    '摄像机': 'camera',
    '话剧剧本': 'drama_script',
    '校帽': 'school_cap',
    '汽车': 'car',
    '眼镜': 'glasses',
    '能面': 'mask',
    '七味粉': 'seven_spice',
    '《白发小僧》': 'white_haired_monk',
    '《幽灵塔》': 'ghost_tower',
    '《阁楼里的两位处女》': 'two_virgins',
    '《脑髓地狱》': 'brain_hell',
    '雨水': 'rain_water'
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
    static createExchangeDialog(onExchange, onCancel, showStationOption = false, showBathOption = false, showCoffeeOption = false, showCinemaOption = false) {
        // 构建选项HTML
        let optionsHTML = `<div class="exchange-options">
                <div class="exchange-option" data-type="draw">从牌堆抽取</div>
                <div class="exchange-option" data-type="player">从其他玩家交换</div>`;

        // 如果显示搭乘电车选项
        if (showStationOption) {
            optionsHTML += `<div class="exchange-option" data-type="station">搭乘电车</div>`;
        }

        // 如果显示兑换洗浴券选项
        if (showBathOption) {
            optionsHTML += `<div class="exchange-option" data-type="bath">洗浴</div>`;
        }

        // 如果显示点餐选项
        if (showCoffeeOption) {
            optionsHTML += `<div class="exchange-option" data-type="coffee">点餐</div>`;
        }

        // 如果显示兑换电影票选项
        if (showCinemaOption) {
            optionsHTML += `<div class="exchange-option" data-type="cinema">兑换电影票</div>`;
        }

        optionsHTML += `</div>`;

        // 创建对话框
        const dialog = this.createDialog(
            'exchange-dialog',
            'exchange-dialog-content',
            '选择交换方式：',
            optionsHTML,
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

    // 创建丢弃道具对话框（晴彦幻象技）
    static createDropItemDialog(availablePlayers, onConfirm, onCancel) {
        // 构建选择界面
        let playerOptions = '';
        availablePlayers.forEach(targetIndex => {
            const targetPlayer = gameState.players[targetIndex];
            playerOptions += `<h4>玩家${targetIndex + 1}（${targetPlayer.role}）的道具：</h4>`;
            if (targetPlayer.items.length === 0) {
                playerOptions += `<div class="no-items">无道具</div>`;
            } else {
                targetPlayer.items.forEach((targetItem, itemIndex) => {
                    playerOptions += `<div class="drop-item" data-target-player="${targetIndex}" data-item-index="${itemIndex}" data-selected="false">${targetItem.name} - ${targetItem.description}</div>`;
                });
            }
        });

        // 创建对话框
        const dialog = this.createDialog(
            'drop-dialog',
            'drop-dialog-content',
            '选择要丢弃的道具（最多选择3个玩家的道具，每个玩家最多选择1个）：',
            `<div class="drop-options">${playerOptions}</div><div class="selected-count">已选择：0/3</div><button class="confirm-button" data-action="confirm" disabled>确认</button>`,
            '取消',
            null,
            onCancel
        );

        // 处理道具选择
        const dropItems = dialog.querySelectorAll('.drop-item');
        const selectedCountElement = dialog.querySelector('.selected-count');
        const confirmButton = dialog.querySelector('.confirm-button');
        const selectedItems = new Map(); // 存储每个玩家选择的道具

        dropItems.forEach(itemElement => {
            itemElement.addEventListener('click', () => {
                const targetPlayer = parseInt(itemElement.dataset.targetPlayer);
                const targetItem = parseInt(itemElement.dataset.itemIndex);
                const isSelected = itemElement.dataset.selected === 'true';

                if (isSelected) {
                    // 取消选择
                    itemElement.dataset.selected = 'false';
                    itemElement.classList.remove('selected');
                    selectedItems.delete(targetPlayer);
                } else {
                    // 检查是否已经选择了3个不同的玩家
                    if (selectedItems.size >= 3) {
                        alert('最多只能选择3个玩家的道具！');
                        return;
                    }

                    // 检查该玩家是否已经选择了道具
                    if (selectedItems.has(targetPlayer)) {
                        // 取消该玩家之前的选择
                        const previousItem = dialog.querySelector(`.drop-item[data-target-player="${targetPlayer}"][data-selected="true"]`);
                        if (previousItem) {
                            previousItem.dataset.selected = 'false';
                            previousItem.classList.remove('selected');
                        }
                    }

                    // 选择新道具
                    itemElement.dataset.selected = 'true';
                    itemElement.classList.add('selected');
                    selectedItems.set(targetPlayer, targetItem);
                }

                // 更新选择计数
                selectedCountElement.textContent = `已选择：${selectedItems.size}/3`;
                
                // 启用/禁用确认按钮
                confirmButton.disabled = selectedItems.size === 0;
            });
        });

        // 处理确认按钮
        confirmButton.addEventListener('click', () => {
            if (selectedItems.size > 0) {
                onConfirm(selectedItems);
                this.closeDialog(dialog);
            }
        });

        // 添加样式
        this.addDialogStyle('drop-dialog');

        return dialog;
    }

    // 创建夺取道具对话框（大蛇丸幻象技）
    static createStealItemDialog(availablePlayers, maxStealCount, onConfirm, onCancel) {
        // 构建选择界面
        let playerOptions = '';
        availablePlayers.forEach(targetIndex => {
            const targetPlayer = gameState.players[targetIndex];
            playerOptions += `<h4>玩家${targetIndex + 1}（${targetPlayer.role}）的道具：</h4>`;
            if (targetPlayer.items.length === 0) {
                playerOptions += `<div class="no-items">无道具</div>`;
            } else {
                targetPlayer.items.forEach((targetItem, itemIndex) => {
                    playerOptions += `<div class="steal-item" data-target-player="${targetIndex}" data-item-index="${itemIndex}" data-selected="false">${targetItem.name} - ${targetItem.description}</div>`;
                });
            }
        });

        // 创建对话框
        const dialog = this.createDialog(
            'steal-dialog',
            'steal-dialog-content',
            `选择要夺取的道具（最多选择${Math.min(2, maxStealCount)}个玩家的道具，每个玩家最多选择1个）：`,
            `<div class="steal-options">${playerOptions}</div><div class="selected-count">已选择：0/${Math.min(2, maxStealCount)}</div><button class="confirm-button" data-action="confirm" disabled>确认</button>`,
            '取消',
            null,
            onCancel
        );

        // 处理道具选择
        const stealItems = dialog.querySelectorAll('.steal-item');
        const selectedCountElement = dialog.querySelector('.selected-count');
        const confirmButton = dialog.querySelector('.confirm-button');
        const selectedItems = new Map(); // 存储每个玩家选择的道具

        stealItems.forEach(itemElement => {
            itemElement.addEventListener('click', () => {
                const targetPlayer = parseInt(itemElement.dataset.targetPlayer);
                const targetItem = parseInt(itemElement.dataset.itemIndex);
                const isSelected = itemElement.dataset.selected === 'true';

                if (isSelected) {
                    // 取消选择
                    itemElement.dataset.selected = 'false';
                    itemElement.classList.remove('selected');
                    selectedItems.delete(targetPlayer);
                } else {
                    // 检查是否已经选择了2个不同的玩家
                    if (selectedItems.size >= 2) {
                        alert('最多只能选择2个玩家的道具！');
                        return;
                    }

                    // 检查是否超过了最大夺取数量
                    if (selectedItems.size >= maxStealCount) {
                        alert(`最多只能夺取${maxStealCount}个道具！`);
                        return;
                    }

                    // 检查该玩家是否已经选择了道具
                    if (selectedItems.has(targetPlayer)) {
                        // 取消该玩家之前的选择
                        const previousItem = dialog.querySelector(`.steal-item[data-target-player="${targetPlayer}"][data-selected="true"]`);
                        if (previousItem) {
                            previousItem.dataset.selected = 'false';
                            previousItem.classList.remove('selected');
                        }
                    }

                    // 选择新道具
                    itemElement.dataset.selected = 'true';
                    itemElement.classList.add('selected');
                    selectedItems.set(targetPlayer, targetItem);
                }

                // 更新选择计数
                selectedCountElement.textContent = `已选择：${selectedItems.size}/${Math.min(2, maxStealCount)}`;
                
                // 启用/禁用确认按钮
                confirmButton.disabled = selectedItems.size === 0;
            });
        });

        // 处理确认按钮
        confirmButton.addEventListener('click', () => {
            if (selectedItems.size > 0) {
                onConfirm(selectedItems);
                this.closeDialog(dialog);
            }
        });

        // 添加样式
        this.addDialogStyle('steal-dialog');

        return dialog;
    }

    // 创建交换道具对话框（帕诺拉马岛幻象技）
    static createExchangeItemsDialog(availablePlayers, onConfirm, onCancel) {
        let step = 1;
        let player1Index = null;
        let player2Index = null;
        let maxExchangeCount = 0;
        let player1SelectedItems = [];
        let player2SelectedItems = [];

        const buildPlayerSelectionHTML = () => {
            let html = '<div class="exchange-step-indicator">步骤 1/3：选择第一位玩家</div>';
            html += '<div class="exchange-players-list">';
            availablePlayers.forEach(targetIndex => {
                const targetPlayer = gameState.players[targetIndex];
                const maxCards = characterAttributes[targetPlayer.role].maxCards;
                html += `<div class="exchange-player-option" data-player-index="${targetIndex}">
                    <div class="player-info-header">玩家${targetIndex + 1}（${targetPlayer.role}）</div>
                    <div class="player-info-detail">道具数量: ${targetPlayer.items.length} / 手牌上限: ${maxCards}</div>
                    <div class="player-items-preview">`;
                if (targetPlayer.items.length === 0) {
                    html += '<span class="no-items-text">无道具</span>';
                } else {
                    targetPlayer.items.forEach(item => {
                        html += `<span class="item-tag">${item.name}</span>`;
                    });
                }
                html += '</div></div>';
            });
            html += '</div>';
            return html;
        };

        const buildPlayer2SelectionHTML = () => {
            let html = '<div class="exchange-step-indicator">步骤 2/3：选择第二位玩家</div>';
            html += '<div class="exchange-players-list">';
            availablePlayers.forEach(targetIndex => {
                if (targetIndex === player1Index) return;
                const targetPlayer = gameState.players[targetIndex];
                const maxCards = characterAttributes[targetPlayer.role].maxCards;
                html += `<div class="exchange-player-option" data-player-index="${targetIndex}">
                    <div class="player-info-header">玩家${targetIndex + 1}（${targetPlayer.role}）</div>
                    <div class="player-info-detail">道具数量: ${targetPlayer.items.length} / 手牌上限: ${maxCards}</div>
                    <div class="player-items-preview">`;
                if (targetPlayer.items.length === 0) {
                    html += '<span class="no-items-text">无道具</span>';
                } else {
                    targetPlayer.items.forEach(item => {
                        html += `<span class="item-tag">${item.name}</span>`;
                    });
                }
                html += '</div></div>';
            });
            html += '</div>';
            return html;
        };

        const buildItemSelectionHTML = () => {
            const player1 = gameState.players[player1Index];
            const player2 = gameState.players[player2Index];
            const player1MaxCards = characterAttributes[player1.role].maxCards;
            const player2MaxCards = characterAttributes[player2.role].maxCards;
            
            maxExchangeCount = Math.min(
                player1.items.length,
                player2.items.length,
                player1MaxCards,
                player2MaxCards
            );

            let html = `<div class="exchange-step-indicator">步骤 3/3：选择要交换的道具（最多交换 ${maxExchangeCount} 个）</div>`;
            html += `<div class="exchange-max-count">本次最多可交换道具数量: ${maxExchangeCount}</div>`;
            
            html += '<div class="exchange-items-container">';
            
            html += `<div class="exchange-player-column">
                <h4>玩家${player1Index + 1}（${player1.role}）的道具</h4>
                <div class="exchange-items-list" data-player="1">`;
            if (player1.items.length === 0) {
                html += '<div class="no-items-text">无道具</div>';
            } else {
                player1.items.forEach((item, itemIndex) => {
                    html += `<div class="exchange-item" data-item-index="${itemIndex}" data-player="1">
                        <span class="item-name">${item.name}</span>
                        <span class="item-desc">${item.description}</span>
                    </div>`;
                });
            }
            html += '</div></div>';
            
            html += `<div class="exchange-player-column">
                <h4>玩家${player2Index + 1}（${player2.role}）的道具</h4>
                <div class="exchange-items-list" data-player="2">`;
            if (player2.items.length === 0) {
                html += '<div class="no-items-text">无道具</div>';
            } else {
                player2.items.forEach((item, itemIndex) => {
                    html += `<div class="exchange-item" data-item-index="${itemIndex}" data-player="2">
                        <span class="item-name">${item.name}</span>
                        <span class="item-desc">${item.description}</span>
                    </div>`;
                });
            }
            html += '</div></div>';
            
            html += '</div>';
            
            html += `<div class="exchange-selection-status">
                <div>玩家${player1Index + 1}已选择: <span id="player1-selected-count">0</span> 个</div>
                <div>玩家${player2Index + 1}已选择: <span id="player2-selected-count">0</span> 个</div>
            </div>`;
            
            html += '<div class="exchange-buttons"><button class="confirm-button" data-action="confirm" disabled>确认交换</button></div>';
            
            return html;
        };

        const dialog = this.createDialog(
            'exchange-items-dialog',
            'exchange-items-dialog-content',
            '帕诺拉马岛 - 交换道具',
            buildPlayerSelectionHTML(),
            '取消',
            null,
            onCancel
        );

        const updateDialogContent = (html) => {
            const content = dialog.querySelector('.exchange-items-dialog-content');
            const header = content.querySelector('h3');
            const body = content.querySelector('div:not(.cancel-button)');
            const cancelButton = content.querySelector('.cancel-button');
            content.innerHTML = '';
            content.appendChild(header);
            const wrapper = document.createElement('div');
            wrapper.innerHTML = html;
            content.appendChild(wrapper);
            content.appendChild(cancelButton);
        };

        const handlePlayer1Selection = () => {
            const playerOptions = dialog.querySelectorAll('.exchange-player-option');
            playerOptions.forEach(option => {
                option.addEventListener('click', () => {
                    player1Index = parseInt(option.dataset.playerIndex);
                    step = 2;
                    updateDialogContent(buildPlayer2SelectionHTML());
                    handlePlayer2Selection();
                });
            });
        };

        const handlePlayer2Selection = () => {
            const playerOptions = dialog.querySelectorAll('.exchange-player-option');
            playerOptions.forEach(option => {
                option.addEventListener('click', () => {
                    player2Index = parseInt(option.dataset.playerIndex);
                    step = 3;
                    updateDialogContent(buildItemSelectionHTML());
                    handleItemSelection();
                });
            });
        };

        const handleItemSelection = () => {
            const exchangeItems = dialog.querySelectorAll('.exchange-item');
            const confirmButton = dialog.querySelector('.confirm-button');
            const player1CountDisplay = dialog.querySelector('#player1-selected-count');
            const player2CountDisplay = dialog.querySelector('#player2-selected-count');

            const updateConfirmButton = () => {
                const count1 = player1SelectedItems.length;
                const count2 = player2SelectedItems.length;
                const canConfirm = count1 > 0 && count2 > 0 && count1 === count2;
                confirmButton.disabled = !canConfirm;
            };

            exchangeItems.forEach(itemElement => {
                itemElement.addEventListener('click', () => {
                    const itemIndex = parseInt(itemElement.dataset.itemIndex);
                    const playerNum = parseInt(itemElement.dataset.player);
                    const isSelected = itemElement.classList.contains('selected');

                    if (isSelected) {
                        itemElement.classList.remove('selected');
                        if (playerNum === 1) {
                            player1SelectedItems = player1SelectedItems.filter(i => i !== itemIndex);
                        } else {
                            player2SelectedItems = player2SelectedItems.filter(i => i !== itemIndex);
                        }
                    } else {
                        const currentPlayerSelectedCount = playerNum === 1 ? player1SelectedItems.length : player2SelectedItems.length;
                        if (currentPlayerSelectedCount >= maxExchangeCount) {
                            alert(`每位玩家最多只能选择 ${maxExchangeCount} 个道具！`);
                            return;
                        }
                        itemElement.classList.add('selected');
                        if (playerNum === 1) {
                            player1SelectedItems.push(itemIndex);
                        } else {
                            player2SelectedItems.push(itemIndex);
                        }
                    }

                    player1CountDisplay.textContent = player1SelectedItems.length;
                    player2CountDisplay.textContent = player2SelectedItems.length;

                    updateConfirmButton();
                });
            });

            confirmButton.addEventListener('click', () => {
                if (player1SelectedItems.length !== player2SelectedItems.length) {
                    alert('双方必须选中等量的道具才能进行交换！');
                    return;
                }
                if (player1SelectedItems.length > 0 && player2SelectedItems.length > 0) {
                    onConfirm({
                        player1Index,
                        player2Index,
                        player1Items: player1SelectedItems,
                        player2Items: player2SelectedItems
                    });
                    this.closeDialog(dialog);
                }
            });
        };

        handlePlayer1Selection();

        return dialog;
    }

    // 创建电光艇对话框
    static createLightningBoatDialog(onConfirm, onCancel) {
        // 创建对话框
        const dialog = document.createElement('div');
        dialog.className = 'lightning-boat-dialog';
        dialog.innerHTML = `
            <div class="lightning-boat-dialog-content">
                <h3>电光艇 - 指定步数</h3>
                <div class="lightning-boat-content">
                    <div class="lightning-boat-step">选择要移动的步数（1-6）：</div>
                    <select id="lightning-boat-steps" class="lightning-boat-select">
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                    </select>
                    <div class="lightning-boat-info" id="lightning-boat-info">
                        即将移动 <span class="steps-value">1</span> * 2 = <span class="total-steps">2</span> 格
                    </div>
                </div>
                <div class="lightning-boat-buttons">
                    <button class="confirm-button" data-action="confirm">确认移动</button>
                    <button class="cancel-button">取消</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        // 处理步数选择
        const stepsSelect = dialog.querySelector('#lightning-boat-steps');
        const stepsValue = dialog.querySelector('.steps-value');
        const totalSteps = dialog.querySelector('.total-steps');

        stepsSelect.addEventListener('change', () => {
            const selectedSteps = parseInt(stepsSelect.value);
            const multipliedSteps = selectedSteps * 2;
            stepsValue.textContent = selectedSteps;
            totalSteps.textContent = multipliedSteps;
        });

        // 处理确认按钮
        const confirmButton = dialog.querySelector('.confirm-button');
        confirmButton.addEventListener('click', () => {
            const selectedSteps = parseInt(stepsSelect.value);
            const multipliedSteps = selectedSteps * 2;
            onConfirm(multipliedSteps);
            this.closeDialog(dialog);
        });

        // 处理取消按钮
        const cancelButton = dialog.querySelector('.cancel-button');
        cancelButton.addEventListener('click', () => {
            onCancel();
            this.closeDialog(dialog);
        });

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
            }
            .${dialogClass} .confirm-button {
                margin-top: 10px;
                margin-right: 10px;
                padding: 10px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
            .${dialogClass} .confirm-button:disabled {
                background-color: #cccccc;
                cursor: not-allowed;
            }
            .${dialogClass} .drop-item {
                padding: 8px;
                margin: 5px 0;
                border: 1px solid #ddd;
                border-radius: 3px;
                cursor: pointer;
            }
            .${dialogClass} .drop-item:hover {
                background-color: #f0f0f0;
            }
            .${dialogClass} .drop-item.selected {
                background-color: #e3f2fd;
                border-color: #2196F3;
            }
            .${dialogClass} .no-items {
                padding: 8px;
                margin: 5px 0;
                color: #999;
                font-style: italic;
            }
            .${dialogClass} .selected-count {
                margin-top: 15px;
                font-weight: bold;
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
                .steal-item.selected {
                    background-color: #e3f2fd;
                    border-color: #2196F3;
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
    constructor() { }
    execute(grid, player) { }
}

// 好感度效果地格策略
class FavorGridStrategy extends GridStrategy {
    execute(grid, player) {
        const favorEffect = grid.favorEffect;
        if (favorEffect.type === 'player') {
            // 掷出此骰子的玩家好感度+10
            if (player.type === 'A' && player.status === 'alive') {
                updateFavor(player, favorEffect.value);
                elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}获得了${favorEffect.value}点好感度！`;
                logEvent(`触发效果：玩家${gameState.currentPlayer + 1}获得了${favorEffect.value}点好感度`);
            } else if (player.role === '薰') {
                // 薰既不回复好感，也不回复行动点
                elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}（薰）无法获得好感度和行动点！`;
                logEvent(`触发效果：玩家${gameState.currentPlayer + 1}（薰）无法获得好感度和行动点`);
            } else {
                elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}（B类型）无法获得好感度！`;
                logEvent(`触发效果：玩家${gameState.currentPlayer + 1}（B类型）无法获得好感度`);
            }
        } else if (favorEffect.type === 'role') {
            // A类某种角色的所有玩家好感度+10
            let affectedPlayers = 0;
            let actionPoints = grid.道具Effect ? grid.道具Effect.value : Math.floor(favorEffect.value / 10);
            gameState.players.forEach((targetPlayer, index) => {
                if (targetPlayer.type === 'A' && targetPlayer.role === favorEffect.role && targetPlayer.status === 'alive') {
                    updateFavor(targetPlayer, favorEffect.value);
                    affectedPlayers++;
                }
                // 薰既不回复好感，也不回复行动点
            });
            if (affectedPlayers > 0) {
                elements.gameMessage.textContent = `所有${favorEffect.role}角色获得了${favorEffect.value}点好感度！`;
                logEvent(`触发效果：所有${favorEffect.role}角色获得了${favorEffect.value}点好感度`);
            } else {
                elements.gameMessage.textContent = `没有${favorEffect.role}角色在场！`;
                logEvent(`触发效果：没有${favorEffect.role}角色在场`);
            }
        } else if (favorEffect.type === 'all') {
            // 全员好感度+10（仅对存活的A类角色生效，薰不回复好感和行动点）
            let affectedPlayers = 0;
            const affectedRoles = [];
            gameState.players.forEach((targetPlayer, index) => {
                if (targetPlayer.type === 'A' && targetPlayer.status === 'alive') {
                    updateFavor(targetPlayer, favorEffect.value);
                    affectedPlayers++;
                    affectedRoles.push(targetPlayer.role);
                }
                // 薰既不回复好感，也不回复行动点
            });
            if (affectedPlayers > 0) {
                const rolesString = affectedRoles.join('、');
                elements.gameMessage.textContent = `${rolesString}获得了${favorEffect.value}点好感度！`;
                logEvent(`触发效果：${rolesString}获得了${favorEffect.value}点好感度`);
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
        // 停滞格子逻辑 - 只在结束回合时生效，这里不做任何操作
        // 结束回合时会在endTurn函数中处理停滞效果
    }
}

// 水洼格子策略
class WaterGridStrategy extends GridStrategy {
    execute(grid, player) {
        // 进入水洼，立刻结束行动，周目+1
        elements.gameMessage.textContent = `棋子进入水洼，结束行动，周目+1！`;
        logEvent(`触发效果：棋子进入水洼，结束行动，周目+1`);

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

        // 增加水洼数
        gameState.puddleCount = (gameState.puddleCount || 0) + 1;
        logEvent(`水洼数增加到${gameState.puddleCount}`);

        // 立即更新UI，显示当前水洼数
        updateUI();

        // 结束当前玩家的行动
        endTurn();
    }
}

// 帝国大学格子策略
class UniversityGridStrategy extends GridStrategy {
    execute(grid, player) {
        // 掷骰子（1-6）
        const diceRoll = Math.floor(Math.random() * 6) + 1;

        // 创建弹出框
        const universityDialog = document.createElement('div');
        universityDialog.className = 'university-dialog';

        // 从模板加载HTML内容
        const templatesIframe = document.getElementById('templates-iframe');
        let template = null;
        if (templatesIframe && templatesIframe.contentDocument) {
            template = templatesIframe.contentDocument.getElementById('university-dialog-template');
        }
        if (!template) {
            template = document.getElementById('university-dialog-template');
        }

        if (template) {
            let templateHTML = template.innerHTML;
            // 替换模板中的变量
            templateHTML = templateHTML.replace('{{diceRoll}}', diceRoll);
            templateHTML = templateHTML.replace('{{message}}', '');
            universityDialog.innerHTML = templateHTML;
        } else {
            // 备用HTML
            universityDialog.innerHTML = `
                <div class="dialog-content">
                    <h3>帝国大学</h3>
                    <p>你在帝国大学进行了一次掷骰子，结果是：<strong>${diceRoll}</strong></p>
                    <div id="dice-result-text"></div>
                    <button class="ok-button">确定</button>
                </div>
            `;
        }

        document.body.appendChild(universityDialog);

        // 根据点数显示不同的结果
        const diceResultText = universityDialog.querySelector('#dice-result-text');
        let message = '';

        switch (diceRoll) {
            case 1:
                message = '在校门口与水上、川濑聊天';
                // 水上、川濑角色玩家好感+10
                gameState.players.forEach(targetPlayer => {
                    if (targetPlayer.status === 'alive' && (targetPlayer.role === '水上' || targetPlayer.role === '川濑')) {
                        updateFavor(targetPlayer, 10);
                    }
                });
                break;
            case 2:
                message = '在教学楼与川濑学习';
                // 川濑角色玩家好感+10
                gameState.players.forEach(targetPlayer => {
                    if (targetPlayer.status === 'alive' && targetPlayer.role === '川濑') {
                        updateFavor(targetPlayer, 10);
                    }
                });
                break;
            case 3:
                message = '在图书馆与水上学习';
                // 水上角色玩家好感+10
                gameState.players.forEach(targetPlayer => {
                    if (targetPlayer.status === 'alive' && targetPlayer.role === '水上') {
                        updateFavor(targetPlayer, 10);
                    }
                });
                break;
            case 4:
                message = '在三四郎池与博士邂逅';
                // 博士角色玩家好感+10
                gameState.players.forEach(targetPlayer => {
                    if (targetPlayer.status === 'alive' && targetPlayer.role === '博士') {
                        updateFavor(targetPlayer, 10);
                    }
                });
                break;
            case 5:
                message = '在研究所与博士、花泽聊天';
                // 博士、花泽角色玩家好感+10
                gameState.players.forEach(targetPlayer => {
                    if (targetPlayer.status === 'alive' && (targetPlayer.role === '博士' || targetPlayer.role === '花泽')) {
                        updateFavor(targetPlayer, 10);
                    }
                });
                break;
            case 6:
                message = '无所事事的一天';
                // 无效果
                break;
        }

        if (diceResultText) {
            diceResultText.textContent = message;
        }

        // 记录日志
        logEvent(`触发效果：玩家${gameState.currentPlayer + 1}（${player.role}）在帝国大学掷骰子，结果为${diceRoll}，${message}`);

        // 处理确定按钮
        const okButton = universityDialog.querySelector('.ok-button');
        if (okButton) {
            okButton.addEventListener('click', () => {
                // 移除对话框
                document.body.removeChild(universityDialog);

                // 显示消息
                elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}在帝国大学${message}！`;

                // 更新UI
                updateUI();
            });
        }
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

        // 水洼格子策略
        if (grid.types && (grid.types.includes('水洼'))) {
            strategies.push(new WaterGridStrategy());
        }

        // 帝国大学格子策略
        if (grid.name === '帝国大学') {
            strategies.push(new UniversityGridStrategy());
        }

        return strategies;
    }
}



// DOM元素
let elements = {};

// 初始化DOM元素
function initElements() {
    elements = {
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
        puddleCount: document.getElementById('puddle-count'),
        gameMessage: document.getElementById('game-message'),
        token: document.getElementById('token'),
        directionIndicator: document.getElementById('direction-indicator'),
        logContent: document.getElementById('log-content'),
        playerCount: document.getElementById('player-count'),

        player1Role: document.getElementById('player1-role'),
        player2Role: document.getElementById('player2-role'),
        player3Role: document.getElementById('player3-role'),
        player4Role: document.getElementById('player4-role'),
        player5Role: document.getElementById('player5-role'),

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
        player5Status: document.getElementById('player5-status'),
        player1Name: document.getElementById('player1-name'),
        player2Name: document.getElementById('player2-name'),
        player3Name: document.getElementById('player3-name'),
        player4Name: document.getElementById('player4-name'),
        player5Name: document.getElementById('player5-name'),
        player1NameDisplay: document.getElementById('player1-name-display'),
        player2NameDisplay: document.getElementById('player2-name-display'),
        player3NameDisplay: document.getElementById('player3-name-display'),
        player4NameDisplay: document.getElementById('player4-name-display'),
        player5NameDisplay: document.getElementById('player5-name-display'),
        saveGame: document.getElementById('save-game'),
        loadGame: document.getElementById('load-game'),
        exportSave: document.getElementById('export-save'),
        importSave: document.getElementById('import-save'),
        loadFantasySkills: document.getElementById('load-fantasy-skills')
    };
}

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
        reverseDirection: gameState.reverseDirection,
        puddleCount: gameState.puddleCount
    };
    gameState.history.push(stateCopy);
    // 限制历史记录长度，只保留最近10个状态
    if (gameState.history.length > 10) {
        gameState.history.shift();
    }
}

// 保存游戏到本地存储
function saveGameToLocalStorage() {
    if (!gameState.gameStarted) {
        alert('游戏尚未开始，无法存档！');
        return;
    }

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
        reverseDirection: gameState.reverseDirection,
        stagnantTurn: gameState.stagnantTurn || -1,
        hasLeftStart: gameState.hasLeftStart || false,
        puddleCount: gameState.puddleCount || 0,
        logs: [...gameState.logs] // 保存日志
    };

    try {
        localStorage.setItem('gameSave', JSON.stringify(stateCopy));
        elements.gameMessage.textContent = '游戏存档成功！';
        logEvent('游戏存档成功');
    } catch (error) {
        console.error('存档失败:', error);
        elements.gameMessage.textContent = '存档失败，请检查存储空间！';
        logEvent('游戏存档失败');
    }
}

// 导出存档为JSON文件
function exportSaveToFile() {
    if (!gameState.gameStarted) {
        alert('游戏尚未开始，无法导出存档！');
        return;
    }

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
        reverseDirection: gameState.reverseDirection,
        stagnantTurn: gameState.stagnantTurn || -1,
        hasLeftStart: gameState.hasLeftStart || false,
        puddleCount: gameState.puddleCount || 0,
        logs: [...gameState.logs], // 导出日志
        timestamp: new Date().toISOString()
    };

    try {
        // 创建JSON字符串
        const jsonString = JSON.stringify(stateCopy, null, 2);

        // 创建Blob对象
        const blob = new Blob([jsonString], { type: 'application/json' });

        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `game-save-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        elements.gameMessage.textContent = '存档导出成功！';
        logEvent('游戏存档导出成功');
    } catch (error) {
        console.error('导出失败:', error);
        elements.gameMessage.textContent = '导出失败，请检查存储空间！';
        logEvent('游戏存档导出失败');
    }
}

// 从本地存储加载游戏
function loadGameFromLocalStorage() {
    try {
        const savedState = localStorage.getItem('gameSave');
        if (!savedState) {
            alert('没有找到存档！');
            return;
        }

        const parsedState = JSON.parse(savedState);

        // 检查存档是否有效
        if (!parsedState.players || !Array.isArray(parsedState.players)) {
            alert('存档格式错误！');
            return;
        }

        // 使用观察者模式更新游戏状态
        gameStateManager.updateState((state) => {
            state.players = parsedState.players;
            state.currentPlayer = parsedState.currentPlayer;
            state.tokenPosition = parsedState.tokenPosition;
            state.round = parsedState.round;
            state.gameStarted = parsedState.gameStarted;
            state.itemPool = parsedState.itemPool;
            state.gameWon = parsedState.gameWon;
            state.week = parsedState.week;
            state.reverseDirection = parsedState.reverseDirection;
            state.stagnantTurn = parsedState.stagnantTurn || -1;
            state.hasLeftStart = parsedState.hasLeftStart || false;
            state.puddleCount = parsedState.puddleCount || 0;
            state.logs = parsedState.logs || []; // 加载日志
        });

        // 生成地图格子
        generateMapGrid();

        // 更新棋子位置
        updateTokenPosition();

        // 更新itemPool变量，使其与gameState.itemPool一致
        itemPool = [...gameState.itemPool];

        // 更新道具池显示
        updateItemPoolDisplay();

        // 更新UI
        updateUI();

        // 重新显示日志
        if (gameState.logs && gameState.logs.length > 0) {
            // 清空当前日志显示
            elements.logContent.innerHTML = '';
            // 重新显示所有日志
            gameState.logs.forEach(log => {
                const logEntry = document.createElement('p');
                logEntry.textContent = log.message;
                elements.logContent.appendChild(logEntry);
            });
            elements.logContent.scrollTop = elements.logContent.scrollHeight;
        }

        elements.gameMessage.textContent = '游戏读档成功！';
        logEvent('游戏读档成功');
    } catch (error) {
        console.error('读档失败:', error);
        elements.gameMessage.textContent = '读档失败，请检查存档文件！';
        logEvent('游戏读档失败');
    }
}

// 导入存档从JSON文件
function importSaveFromFile() {
    // 创建文件输入元素
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const parsedState = JSON.parse(e.target.result);

                // 检查存档是否有效
                if (!parsedState.players || !Array.isArray(parsedState.players)) {
                    alert('存档格式错误！');
                    return;
                }

                // 使用观察者模式更新游戏状态
                gameStateManager.updateState((state) => {
                    state.players = parsedState.players;
                    state.currentPlayer = parsedState.currentPlayer;
                    state.tokenPosition = parsedState.tokenPosition;
                    state.round = parsedState.round;
                    state.gameStarted = parsedState.gameStarted;
                    state.itemPool = parsedState.itemPool;
                    state.gameWon = parsedState.gameWon;
                    state.week = parsedState.week;
                    state.reverseDirection = parsedState.reverseDirection;
                    state.stagnantTurn = parsedState.stagnantTurn || -1;
                    state.hasLeftStart = parsedState.hasLeftStart || false;
                    state.puddleCount = parsedState.puddleCount || 0;
                    state.logs = parsedState.logs || []; // 加载日志
                });

                // 生成地图格子
                generateMapGrid();

                // 更新棋子位置
                updateTokenPosition();

                // 更新itemPool变量，使其与gameState.itemPool一致
                itemPool = [...gameState.itemPool];

                // 更新道具池显示
                updateItemPoolDisplay();

                // 更新UI
                updateUI();

                // 重新显示日志
                if (gameState.logs && gameState.logs.length > 0) {
                    // 清空当前日志显示
                    elements.logContent.innerHTML = '';
                    // 重新显示所有日志
                    gameState.logs.forEach(log => {
                        const logEntry = document.createElement('p');
                        logEntry.textContent = log.message;
                        elements.logContent.appendChild(logEntry);
                    });
                    elements.logContent.scrollTop = elements.logContent.scrollHeight;
                }

                elements.gameMessage.textContent = '游戏读档成功！';
                logEvent('游戏读档成功');
            } catch (error) {
                console.error('读档失败:', error);
                elements.gameMessage.textContent = '读档失败，请检查存档文件！';
                logEvent('游戏读档失败');
            }
        };
        reader.readAsText(file);
    };

    input.click();
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

    // 获取玩家角色设置和中之人名称
    const playerRoles = [];
    const playerNames = [];
    for (let i = 1; i <= playerCount; i++) {
        const role = document.getElementById(`player${i}-role`).value;
        const name = document.getElementById(`player${i}-name`).value || '匿名';
        playerRoles.push(role);
        playerNames.push(name);
    }

    // 设置玩家属性和重置游戏状态（使用观察者模式）
    gameStateManager.updateState((state) => {
        state.players = [];
        for (let i = 0; i < playerCount; i++) {
            const role = playerRoles[i];
            const name = playerNames[i];
            state.players.push({
                type: characterAttributes[role].type,
                role: role,
                name: name,
                cards: 0,
                items: [],
                fantasySkills: [],
                favor: characterAttributes[role].initialFavor,
                status: 'alive',
                action: characterAttributes[role].action,
                hasKeychain: false,
                hasActed: false
            });
        }

        state.currentPlayer = 0;
        state.tokenPosition = 0;
        state.gameStarted = true;
        state.gameWon = false;
        state.week = 1;
        state.reverseDirection = false;
        state.stagnantTurn = -1;
        state.hasLeftStart = false; // 初始化离开起点标志
    });

    // 生成地图格子
    generateMapGrid();

    // 等待1秒后更新棋子位置，确保地图格子已经完全生成
    setTimeout(() => {
        // 确保棋子位置正确更新
        updateTokenPosition();
    }, 200);

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

            // 如果是店主角色，抽取幻象技
            if (player.role === '店主') {
                const maxFantasySkills = characterAttributes[player.role].maxFantasySkills || 0;
                const fantasySkillNames = Object.keys(fantasySkills);
                
                while (player.fantasySkills.length < maxFantasySkills && fantasySkillNames.length > 0) {
                    const randomIndex = Math.floor(Math.random() * fantasySkillNames.length);
                    const skillName = fantasySkillNames[randomIndex];
                    const skill = fantasySkills[skillName];

                    // 从可用技能中移除该技能
                    fantasySkillNames.splice(randomIndex, 1);

                    // 添加技能到玩家的幻象技数组
                    player.fantasySkills.push(skill);

                    // 如果是蛙男技能，自动生效
                    if (skill.name === '蛙男') {
                        player.hasFrogManSkill = true;
                        player.fantasySkills[player.fantasySkills.length - 1].used = true;
                        logEvent(`玩家${i + 1}（店主）的幻象技${skill.name}生效，全程不会成为其他角色强制丢弃道具或损耗行动点的对象`);
                    } else {
                        logEvent(`玩家${i + 1}（店主）游戏开始，获得幻象技${skill.name}`);
                    }
                }
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

    // 显示第一个玩家的行动开始弹窗
    showActionStartDialog();
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

        // 如果是店主角色，显示幻象技
        if (player.role === '店主') {
            const fantasySkillsContainer = document.getElementById(`player${i + 1}-fantasy-skills`);
            if (!fantasySkillsContainer) {
                // 如果幻象技容器不存在，创建它
                const container = document.createElement('div');
                container.className = 'fantasy-skills-container';
                container.innerHTML = '<p>幻象技:</p><div id="player' + (i + 1) + '-fantasy-skills" class="fantasy-skills-list"></div>';
                itemsContainer.parentNode.appendChild(container);
            }

            const skillsContainer = document.getElementById(`player${i + 1}-fantasy-skills`);
            skillsContainer.innerHTML = '';

            player.fantasySkills.forEach((skill, index) => {
                const skillElement = document.createElement('div');
                skillElement.className = 'fantasy-skill';
                if (skill.used) {
                    skillElement.classList.add('used');
                }
                skillElement.textContent = skill.name;
                skillElement.title = skill.description;

                // 只要是店主且存活且游戏未胜利且技能未使用，就可以使用幻象技（无论是否是当前回合）
                if (player.role === '店主' && player.status === 'alive' && !gameState.gameWon && !skill.used) {
                    skillElement.style.cursor = 'pointer';
                    skillElement.addEventListener('click', () => useFantasySkillByIndex(i, index));
                } else {
                    skillElement.classList.add('used');
                }

                skillsContainer.appendChild(skillElement);
            });
        }
    }
}



// 通过索引使用幻象技
function useFantasySkillByIndex(playerIndex, skillIndex) {
    const player = gameState.players[playerIndex];
    const skill = player.fantasySkills[skillIndex];
    
    // 检查是否是店主
    if (player.role !== '店主') {
        elements.gameMessage.textContent = '只有店主可以使用幻象技！';
        logEvent(`玩家${playerIndex + 1}（${player.role}）尝试使用幻象技，但只有店主可以使用`);
        return;
    }
    
    // 检查技能是否已使用
    if (skill.used) {
        elements.gameMessage.textContent = '该幻象技已经使用过了！';
        logEvent(`玩家${playerIndex + 1}（店主）尝试使用已使用的幻象技${skill.name}`);
        return;
    }
    
    // 检查是否是被动技能（如蛙男）
    if (skill.name === '蛙男') {
        elements.gameMessage.textContent = '蛙男是被动幻象技，游戏开始时自动生效！';
        logEvent(`玩家${playerIndex + 1}（店主）尝试使用被动幻象技${skill.name}`);
        return;
    }
    
    // 保存游戏状态到历史记录，以便可以撤回操作
    saveGameState();
    
    // 处理幻象技效果
    handleFantasySkillEffect(skill, player, playerIndex, skillIndex);
    
    // 更新UI
    updateItemsDisplay();
}

// 处理幻象技效果
function handleFantasySkillEffect(skill, player, playerIndex, skillIndex) {
    switch (skill.name) {
        case '测试':
            // 标记幻象技为已使用
            player.fantasySkills[skillIndex] = {
                ...skill,
                used: true
            };
            // 店主行动点+10
            player.action += 10;
            logEvent(`玩家${playerIndex + 1}（店主）使用幻象技${skill.name}，获得了10点行动点`);
            elements.gameMessage.textContent = `玩家${playerIndex + 1}（店主）使用了幻象技${skill.name}，获得了10点行动点！`;
            break;
        case '晴彦':
            // 强制最多三名存活角色各丢弃一张道具卡（由你指定）
            logEvent(`玩家${playerIndex + 1}（店主）使用幻象技${skill.name}`);
            
            // 过滤出其他存活玩家
            const availablePlayers = [];
            gameState.players.forEach((targetPlayer, targetIndex) => {
                if (targetIndex !== playerIndex && targetPlayer.status === 'alive' && targetPlayer.items.length > 0) {
                    availablePlayers.push(targetIndex);
                }
            });
            
            if (availablePlayers.length === 0) {
                elements.gameMessage.textContent = '没有可丢弃道具的目标！';
                logEvent(`玩家${playerIndex + 1}（店主）使用幻象技${skill.name}，但没有可丢弃道具的目标`);
                break;
            }
            
            // 创建丢弃道具对话框
            GameDialogService.createDropItemDialog(
                availablePlayers,
                (selectedItems) => {
                    // 标记幻象技为已使用
                    player.fantasySkills[skillIndex] = {
                        ...skill,
                        used: true
                    };
                    // 处理丢弃道具
                    selectedItems.forEach((itemIndex, targetPlayerIndex) => {
                        const targetPlayer = gameState.players[targetPlayerIndex];
                        const droppedItem = targetPlayer.items[itemIndex];
                        
                        // 从目标玩家手中移除道具
                        targetPlayer.items.splice(itemIndex, 1);
                        targetPlayer.cards = Math.max(0, targetPlayer.cards - 1);
                        
                        // 记录日志
                        logEvent(`玩家${playerIndex + 1}（店主）使用幻象技${skill.name}，强制玩家${targetPlayerIndex + 1}（${targetPlayer.role}）丢弃了道具${droppedItem.name}`);
                    });
                    
                    elements.gameMessage.textContent = `玩家${playerIndex + 1}（店主）使用了幻象技${skill.name}，强制${selectedItems.size}名玩家各丢弃了一张道具！`;
                    
                    // 更新UI
                    updateUI();
                },
                () => {
                    // 取消使用幻象技
                    logEvent(`玩家${playerIndex + 1}（店主）取消使用幻象技${skill.name}`);
                    elements.gameMessage.textContent = `玩家${playerIndex + 1}（店主）取消使用幻象技${skill.name}！`;
                }
            );
            break;
        case '蛙男':
            // 全程不得成为其他角色强制你丢弃道具卡或损耗行动点的对象
            // 被动技能，标记为已生效
            player.hasFrogManSkill = true;
            logEvent(`玩家${playerIndex + 1}（店主）的幻象技${skill.name}生效，全程不会成为其他角色强制丢弃道具或损耗行动点的对象`);
            elements.gameMessage.textContent = `玩家${playerIndex + 1}（店主）的幻象技${skill.name}生效！`;
            break;
        case '大蛇丸':
            // 从最多两名存活玩家手中各夺取一张道具卡（由你指定）
            logEvent(`玩家${playerIndex + 1}（店主）使用幻象技${skill.name}`);
            
            // 检查是否达到手牌上限
            const handLimit = characterAttributes[player.role].maxCards; // 使用角色的实际最大手牌值
            const currentHandCount = player.items.length;
            const availableSlots = handLimit - currentHandCount;
            
            if (availableSlots <= 0) {
                elements.gameMessage.textContent = '你的手牌已达到上限，无法使用大蛇丸幻象技！';
                logEvent(`玩家${playerIndex + 1}（店主）尝试使用大蛇丸幻象技，但手牌已达到上限`);
                return;
            }
            
            // 计算最多可以夺取的道具数量
            const maxStealCount = Math.min(2, availableSlots);
            
            // 过滤出其他存活玩家
            const stealablePlayers = [];
            gameState.players.forEach((targetPlayer, targetIndex) => {
                if (targetIndex !== playerIndex && targetPlayer.status === 'alive' && targetPlayer.items.length > 0) {
                    stealablePlayers.push(targetIndex);
                }
            });
            
            if (stealablePlayers.length === 0) {
                elements.gameMessage.textContent = '没有可夺取道具的目标！';
                logEvent(`玩家${playerIndex + 1}（店主）使用大蛇丸幻象技，但没有可夺取道具的目标`);
                return;
            }
            
            // 创建夺取道具对话框
            GameDialogService.createStealItemDialog(
                stealablePlayers,
                maxStealCount,
                (selectedItems) => {
                    // 标记幻象技为已使用
                    player.fantasySkills[skillIndex] = {
                        ...skill,
                        used: true
                    };
                    // 处理夺取道具
                    selectedItems.forEach((itemIndex, targetPlayerIndex) => {
                        const targetPlayer = gameState.players[targetPlayerIndex];
                        const stolenItem = targetPlayer.items[itemIndex];
                        
                        // 从目标玩家手中移除道具
                        targetPlayer.items.splice(itemIndex, 1);
                        targetPlayer.cards = Math.max(0, targetPlayer.cards - 1);
                        
                        // 添加到当前玩家手中
                        player.items.push(stolenItem);
                        player.cards++;
                        
                        // 记录日志
                        logEvent(`玩家${playerIndex + 1}（店主）使用幻象技${skill.name}，从玩家${targetPlayerIndex + 1}（${targetPlayer.role}）手中夺取了道具${stolenItem.name}`);
                    });
                    
                    elements.gameMessage.textContent = `玩家${playerIndex + 1}（店主）使用了幻象技${skill.name}，从${selectedItems.size}名玩家手中各夺取了一张道具！`;
                    
                    // 更新UI
                    updateUI();
                },
                () => {
                    // 取消使用幻象技
                    logEvent(`玩家${playerIndex + 1}（店主）取消使用幻象技${skill.name}`);
                    elements.gameMessage.textContent = `玩家${playerIndex + 1}（店主）取消使用幻象技${skill.name}！`;
                }
            );
            break;
        case '帕诺拉马岛':
            // 交换在场任意两位存活角色的道具卡（交换数量需在角色的手牌上限内）
            logEvent(`玩家${playerIndex + 1}（店主）使用幻象技${skill.name}`);
            
            // 过滤出所有存活玩家
            const alivePlayers = [];
            gameState.players.forEach((targetPlayer, targetIndex) => {
                if (targetPlayer.status === 'alive') {
                    alivePlayers.push(targetIndex);
                }
            });
            
            if (alivePlayers.length < 2) {
                elements.gameMessage.textContent = '存活玩家不足2人，无法使用帕诺拉马岛！';
                logEvent(`玩家${playerIndex + 1}（店主）使用幻象技${skill.name}，但存活玩家不足2人`);
                return;
            }
            
            // 创建交换道具对话框
            GameDialogService.createExchangeItemsDialog(
                alivePlayers,
                (result) => {
                    // 标记幻象技为已使用
                    player.fantasySkills[skillIndex] = {
                        ...skill,
                        used: true
                    };
                    
                    const { player1Index, player2Index, player1Items, player2Items } = result;
                    const player1 = gameState.players[player1Index];
                    const player2 = gameState.players[player2Index];
                    
                    // 获取要交换的道具
                    const player1ExchangeItems = player1Items.map(idx => player1.items[idx]);
                    const player2ExchangeItems = player2Items.map(idx => player2.items[idx]);
                    
                    // 从原玩家手中移除道具（从后往前删除，避免索引问题）
                    player1Items.sort((a, b) => b - a).forEach(idx => {
                        player1.items.splice(idx, 1);
                    });
                    player2Items.sort((a, b) => b - a).forEach(idx => {
                        player2.items.splice(idx, 1);
                    });
                    
                    // 将道具添加到对方手中
                    player1.items.push(...player2ExchangeItems);
                    player2.items.push(...player1ExchangeItems);
                    
                    // 更新手牌数
                    player1.cards = player1.items.length;
                    player2.cards = player2.items.length;
                    
                    // 记录日志
                    const player1ItemNames = player1ExchangeItems.map(item => item.name).join('、');
                    const player2ItemNames = player2ExchangeItems.map(item => item.name).join('、');
                    
                    logEvent(`玩家${playerIndex + 1}（店主）使用幻象技${skill.name}，玩家${player1Index + 1}（${player1.role}）的${player1ItemNames}与玩家${player2Index + 1}（${player2.role}）的${player2ItemNames}进行了交换`);
                    
                    elements.gameMessage.textContent = `玩家${playerIndex + 1}（店主）使用了幻象技${skill.name}，交换完成！`;
                    
                    // 更新UI
                    updateUI();
                },
                () => {
                    // 取消使用幻象技
                    logEvent(`玩家${playerIndex + 1}（店主）取消使用幻象技${skill.name}`);
                    elements.gameMessage.textContent = `玩家${playerIndex + 1}（店主）取消使用幻象技${skill.name}！`;
                }
            );
            break;
        case '电光艇':
            // 指定棋子步数并x2
            logEvent(`玩家${playerIndex + 1}（店主）使用幻象技${skill.name}`);
            
            // 创建电光艇对话框
            GameDialogService.createLightningBoatDialog(
                (totalSteps) => {
                    // 标记幻象技为已使用
                    player.fantasySkills[skillIndex] = {
                        ...skill,
                        used: true
                    };
                    
                    // 记录原始位置
                    const originalPosition = gameState.tokenPosition;
                    
                    // 移动棋子
                    if (gameState.reverseDirection) {
                        // 逆时针移动
                        gameState.tokenPosition = (gameState.tokenPosition - totalSteps + gridConfig.length) % gridConfig.length;
                    } else {
                        // 顺时针移动
                        gameState.tokenPosition = (gameState.tokenPosition + totalSteps) % gridConfig.length;
                    }
                    
                    // 更新棋子位置
                    updateTokenPosition();
                    
                    // 触发格子效果
                    const currentGrid = gridConfig[gameState.tokenPosition];
                    const currentPlayer = gameState.players[gameState.currentPlayer];
                    const strategies = GridStrategyFactory.getStrategies(currentGrid);
                    
                    // 检查是否是水洼格子（会结束回合）
                    const isWaterGrid = currentGrid.types && currentGrid.types.includes('水洼');
                    
                    strategies.forEach(strategy => {
                        strategy.execute(currentGrid, currentPlayer);
                    });
                    
                    // 如果是水洼格子，WaterGridStrategy已经调用了endTurn()结束回合
                    // 不再执行后续代码，直接返回
                    if (isWaterGrid) {
                        return;
                    }
                    
                    // 记录日志
                    logEvent(`玩家${playerIndex + 1}（店主）使用幻象技${skill.name}，棋子移动了${totalSteps}格`);
                    elements.gameMessage.textContent = `玩家${playerIndex + 1}（店主）使用了幻象技${skill.name}，棋子移动了${totalSteps}格！`;
                    
                    // 更新UI
                    updateUI();
                },
                () => {
                    // 取消使用幻象技
                    logEvent(`玩家${playerIndex + 1}（店主）取消使用幻象技${skill.name}`);
                    elements.gameMessage.textContent = `玩家${playerIndex + 1}（店主）取消使用幻象技${skill.name}！`;
                }
            );
            break;
        case '河童':
            // 跳过任一自己以外角色的一回合
            // 实现逻辑
            logEvent(`玩家${playerIndex + 1}（店主）使用幻象技${skill.name}`);
            elements.gameMessage.textContent = `玩家${playerIndex + 1}（店主）使用了幻象技${skill.name}！`;
            break;
        case '关东大地震':
            // 除你自己以外全员行动值及手牌归零且好感度全部降低到30点
            // 实现逻辑
            logEvent(`玩家${playerIndex + 1}（店主）使用幻象技${skill.name}`);
            elements.gameMessage.textContent = `玩家${playerIndex + 1}（店主）使用了幻象技${skill.name}！`;
            break;
        default:
            logEvent(`玩家${playerIndex + 1}（店主）使用了未知幻象技${skill.name}`);
            elements.gameMessage.textContent = `玩家${playerIndex + 1}（店主）使用了幻象技${skill.name}！`;
    }
    
    // 更新UI，确保行动点等信息得到及时更新
    updateUI();
}

// 使用道具
function useItem(playerIndex, itemIndex) {
    const player = gameState.players[playerIndex];
    const item = player.items[itemIndex];

    if (!item) {
        elements.gameMessage.textContent = '道具不存在，无法使用！';
        logEvent(`玩家${playerIndex + 1}尝试使用不存在的道具`);
        return;
    }

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

    // 检查道具是否是当前回合抽牌获得的
    if (item.obtainedBy === 'draw' && item.obtainedTurn === gameState.round) {
        elements.gameMessage.textContent = `该道具是当前回合抽牌获得的，需要到下一回合才能使用！`;
        logEvent(`玩家${playerIndex + 1}（${player.role}）尝试使用当前回合抽牌获得的道具${item.name}，但需要到下一回合才能使用`);
        return;
    }

    // 检查行动点（特殊角色使用特定武器或道具不消耗行动点，所以即使行动点为0也可以使用）
    const actionPoints = Number(player.action) || 0;
    let canUseWithoutAction = false;
    
    // 标记本回合已行动
    player.hasActed = true;

    // 检查是否为特殊角色使用特定武器或道具
    if (item.type && item.type === 'kill_with_weapon') {
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
    } else if (item.name === '金鱼花洒') {
        if (player.role === '博士') {
            canUseWithoutAction = true;
        }
    } else if (item.name === '三文鱼罐头') {
        if (player.role === '花泽') {
            canUseWithoutAction = true;
        }
    } else if (item.name === '摄像机') {
        if (player.role === '水上') {
            canUseWithoutAction = true;
        }
    } else if (item.name === '话剧剧本') {
        if (player.role === '川濑') {
            canUseWithoutAction = true;
        }
    } else if (item.name === '能面') {
        if (player.role === '薰') {
            canUseWithoutAction = true;
        }
    } else if (item.name === '《白发小僧》') {
        if (player.role === '店主') {
            canUseWithoutAction = true;
        }
    } else if (item.name === '《幽灵塔》') {
        if (player.role === '博士') {
            canUseWithoutAction = true;
        }
    } else if (item.name === '《阁楼里的两位处女》') {
        if (player.role === '水上') {
            canUseWithoutAction = true;
        }
    } else if (item.name === '钱') {
        // 检查当前是否在市营电车站、机械汤、咖啡厅或电影院格子上
        const currentGrid = gridConfig[gameState.tokenPosition];
        if (currentGrid && (currentGrid.name === '市营电车站' || currentGrid.name === '机械汤' || currentGrid.name === '咖啡厅' || currentGrid.name === '电影院')) {
            canUseWithoutAction = true;
        }
    } else if (item.name === '时光机') {
        // 博士不消耗行动点可使用此道具
        if (player.role === '博士') {
            canUseWithoutAction = true;
        }
    } else if (item.name === '汽车') {
        // 汽车道具特殊处理，不消耗初始1点行动点，在道具策略中消耗2点
        canUseWithoutAction = true;
    } else if (item.name === '眼镜') {
        // 眼镜道具特殊处理，不消耗初始1点行动点，在道具策略中消耗1点
        canUseWithoutAction = true;
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
        if (item.type && item.type === 'kill_with_weapon') {
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
        } else if (item.name === '金鱼花洒') {
            if (player.role === '博士') {
                shouldConsumeAction = false;
            }
        } else if (item.name === '三文鱼罐头') {
            if (player.role === '花泽') {
                shouldConsumeAction = false;
            }
        } else if (item.name === '摄像机') {
            if (player.role === '水上') {
                shouldConsumeAction = false;
            }
        } else if (item.name === '话剧剧本') {
            if (player.role === '川濑') {
                shouldConsumeAction = false;
            }
        } else if (item.name === '能面') {
            if (player.role === '薰') {
                shouldConsumeAction = false;
            }
        } else if (item.name === '《白发小僧》') {
            if (player.role === '店主') {
                shouldConsumeAction = false;
            }
        } else if (item.name === '《幽灵塔》') {
            if (player.role === '博士') {
                shouldConsumeAction = false;
            }
        } else if (item.name === '《阁楼里的两位处女》') {
            if (player.role === '水上') {
                shouldConsumeAction = false;
            }
        } else if (item.name === '钱') {
            // 检查当前是否在市营电车站、机械汤、咖啡厅或电影院格子上
            const currentGrid = gridConfig[gameState.tokenPosition];
            if (currentGrid && (currentGrid.name === '市营电车站' || currentGrid.name === '机械汤' || currentGrid.name === '咖啡厅' || currentGrid.name === '电影院')) {
                shouldConsumeAction = false;
            }
        } else if (item.name === '时光机') {
            // 博士不消耗行动点可使用此道具
            if (player.role === '博士') {
                shouldConsumeAction = false;
            }
        } else if (item.name === '汽车') {
            // 汽车道具特殊处理，不消耗初始1点行动点，在道具策略中消耗2点
            shouldConsumeAction = false;
        } else if (item.name === '眼镜') {
            // 眼镜道具特殊处理，不消耗初始1点行动点，在道具策略中消耗1点
            shouldConsumeAction = false;
        }
        if (shouldConsumeAction) {
            player.action = Number(player.action) || 0;
            player.action--;
        }

        // 使用策略模式处理道具效果
        const strategy = ItemStrategyFactory.getStrategy(item);
        const shouldContinue = strategy.execute(player, playerIndex, item, itemIndex);

        // 从道具列表中移除（特殊道具已在各自的策略中处理）
        if (shouldContinue !== false && (!item.type || item.type !== 'steal') && item.name !== '大瓶可尔思必' && item.name !== '念珠' && (!item.type || item.type !== 'exchange') && (!item.type || item.type !== 'kill_with_weapon') && (!item.type || item.type !== 'favor') && (!item.type || item.type !== 'action') && (!item.type || item.type !== 'move') && (!item.type || item.type !== 'reverse_move')) {
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
            if (item.targetGrid !== undefined || (item.type && item.type === 'custom_move')) {
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

    // 更新水洼数显示
    elements.puddleCount.textContent = gameState.puddleCount || 0;

    // 更新方向指示器
    updateDirectionIndicator();

    // 更新玩家信息和当前玩家样式
    const playerCount = gameState.players.length;
    for (let i = 0; i < playerCount; i++) {
        const player = gameState.players[i];
        elements[`player${i + 1}RoleDisplay`].textContent = player.role;
        elements[`player${i + 1}NameDisplay`].textContent = `(${player.name})`;
        // elements[`player${i + 1}Action`].textContent = player.action || characterAttributes[player.role].action;
        // 如果 action 是 undefined 或 null，则使用初始值；如果是 0 或其他数字，则直接显示该数字
        const currentAction = (player.action !== undefined && player.action !== null)
            ? player.action
            : characterAttributes[player.role].action;

        elements[`player${i + 1}Action`].textContent = currentAction;

        elements[`player${i + 1}Cards`].textContent = player.cards;
        elements[`player${i + 1}Favor`].textContent = player.role === '薰' ? '???' : player.favor;
        elements[`player${i + 1}Status`].textContent = player.status === 'alive' ? '存活' : '死亡';

        // 更新当前玩家样式
        const playerElement = document.querySelector(`.player.player${i + 1}`);
        if (i === gameState.currentPlayer) {
            playerElement.classList.add('current-player');
        } else {
            playerElement.classList.remove('current-player');
        }

        // 更新钥匙串图标
        const playerNameElement = playerElement.querySelector('h3');
        // 移除现有的钥匙图标
        const existingKeyIcon = playerNameElement.querySelector('.key-icon');
        if (existingKeyIcon) {
            playerNameElement.removeChild(existingKeyIcon);
        }
        // 如果钥匙串生效，添加钥匙图标
        if (player.hasKeychain) {
            const keyIcon = document.createElement('span');
            keyIcon.className = 'key-icon';
            keyIcon.innerHTML = '🔑';
            keyIcon.style.color = 'green';
            keyIcon.style.marginLeft = '5px';
            playerNameElement.appendChild(keyIcon);
        }
    }

    // 更新道具显示
    updateItemsDisplay();

    // 更新杀人按钮状态
    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (elements.killPlayer) {
        elements.killPlayer.disabled = currentPlayer.role !== '花泽' && currentPlayer.role !== '薰';
    }

    // 更新棋子位置
    updateTokenPosition();
}

// 更新棋子位置
function updateTokenPosition() {
    // 检查gridConfig是否为空
    if (gridConfig.length === 0) {
        console.warn('地图尚未加载，跳过棋子位置更新');
        return;
    }

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

    // 处理市营电车站的可点击状态
    handleStationClickable();
}

// 处理市营电车站的可点击状态
function handleStationClickable() {
    // 移除所有市营电车站的可点击状态
    const allStations = document.querySelectorAll('.grid-station');
    allStations.forEach(station => {
        station.classList.remove('clickable');
        station.onclick = null;
    });

    // 检查当前格子是否是市营电车站
    const currentGrid = gridConfig[gameState.tokenPosition];
    if (currentGrid.name === '市营电车站') {
        // 检查当前玩家是否有钱道具卡
        const currentPlayer = gameState.players[gameState.currentPlayer];
        const hasMoney = currentPlayer.items.some(item => item.name === '钱');

        if (hasMoney) {
            // 找到当前市营电车站格子并设置为可点击
            const currentStation = document.querySelector(`.grid-${gameState.tokenPosition}`);
            if (currentStation) {
                currentStation.classList.add('clickable');
                currentStation.onclick = function () {
                    showStationDialog();
                };
            }
        }
    }
}

// 显示市营电车站弹窗
function showStationDialog(player, playerIndex, itemIndex) {
    // 创建弹出框
    const stationDialog = document.createElement('div');
    stationDialog.className = 'station-dialog';

    // 从模板加载HTML内容
    const templatesIframe = document.getElementById('templates-iframe');
    let template = null;
    if (templatesIframe && templatesIframe.contentDocument) {
        template = templatesIframe.contentDocument.getElementById('station-dialog-template');
    }
    if (!template) {
        template = document.getElementById('station-dialog-template');
    }
    if (template) {
        stationDialog.innerHTML = template.innerHTML;
    }

    document.body.appendChild(stationDialog);

    // 绘制地图格子
    const stationMap = stationDialog.querySelector('#station-map');
    if (stationMap) {
        gridConfig.forEach((grid, index) => {
            const isCurrent = index === gameState.tokenPosition;
            const isStation = grid.name === '市营电车站';
            const isSelectable = isStation && !isCurrent;
            const className = `map-grid-item grid-${index} ${isSelectable ? 'selectable' : 'unselectable'} ${isCurrent ? 'current' : ''}`;
            const dataIndex = isSelectable ? `data-grid-index="${index}"` : '';

            const gridElement = document.createElement('div');
            gridElement.className = className;
            if (isSelectable) {
                gridElement.dataset.gridIndex = index;
            }
            gridElement.innerHTML = `
                <div class="grid-id">${grid.id}</div>
                <div class="grid-name">${grid.name}</div>
            `;
            stationMap.appendChild(gridElement);
        });
    }

    // 处理格子选择
    const selectableItems = stationDialog.querySelectorAll('.map-grid-item.selectable');
    selectableItems.forEach(itemElement => {
        itemElement.addEventListener('click', () => {
            const targetGridIndex = parseInt(itemElement.dataset.gridIndex);
            const targetGrid = gridConfig[targetGridIndex];

            // 移动棋子
            const oldPosition = gameState.tokenPosition;
            const oldGrid = gridConfig[oldPosition];
            gameState.tokenPosition = targetGridIndex;
            updateTokenPosition();

            // 消耗钱道具卡
            player.items.splice(itemIndex, 1);
            player.cards = Math.max(0, player.cards - 1);

            // 记录移动日志
            logEvent(`玩家${playerIndex + 1}（${player.role}）使用钱道具卡，从${oldGrid.id}.${oldGrid.name}传送到${targetGrid.id}.${targetGrid.name}`);

            // 显示消息
            elements.gameMessage.textContent = `玩家${playerIndex + 1}使用了钱道具卡，传送到${targetGrid.id}.${targetGrid.name}！`;

            // 移除对话框
            document.body.removeChild(stationDialog);

            // 处理行动后逻辑
            handlePostActionLogic(player, playerIndex);

            // 处理新位置的格子功能
            setTimeout(() => {
                handleGridFunction();
            }, 500);
        });
    });

    // 处理取消按钮
    const cancelButton = stationDialog.querySelector('.cancel-station');
    cancelButton.addEventListener('click', () => {
        // 处理道具取消
        handleItemCancel(player, playerIndex, { name: '钱' });
        document.body.removeChild(stationDialog);
    });
}

// 显示水道桥弹窗
function showWaterwayDialog() {
    // 创建弹出框
    const waterwayDialog = document.createElement('div');
    waterwayDialog.className = 'station-dialog';

    // 从模板加载HTML内容
    const templatesIframe = document.getElementById('templates-iframe');
    let template = null;
    if (templatesIframe && templatesIframe.contentDocument) {
        template = templatesIframe.contentDocument.getElementById('waterway-dialog-template');
    }
    if (!template) {
        template = document.getElementById('waterway-dialog-template');
    }
    if (template) {
        waterwayDialog.innerHTML = template.innerHTML;
    }

    document.body.appendChild(waterwayDialog);

    // 显示玩家拥有的道具
    const itemList = waterwayDialog.querySelector('#waterway-item-list');
    if (itemList) {
        const currentPlayer = gameState.players[gameState.currentPlayer];
        if (currentPlayer.items.length === 0) {
            itemList.innerHTML = '<p>你没有任何道具可以丢弃</p>';
        } else {
            currentPlayer.items.forEach((item, index) => {
                const itemElement = document.createElement('div');
                itemElement.className = 'waterway-item';
                itemElement.dataset.itemIndex = index;
                itemElement.innerHTML = `
                    <div class="item-name">${item.name}</div>
                    <div class="item-description">${item.description}</div>
                `;
                itemList.appendChild(itemElement);
            });
        }
    }

    // 处理道具选择
    const itemElements = waterwayDialog.querySelectorAll('.waterway-item');
    itemElements.forEach(itemElement => {
        itemElement.addEventListener('click', () => {
            const itemIndex = parseInt(itemElement.dataset.itemIndex);
            const currentPlayer = gameState.players[gameState.currentPlayer];
            const item = currentPlayer.items[itemIndex];

            // 从玩家道具栏中移除道具
            currentPlayer.items.splice(itemIndex, 1);
            currentPlayer.cards = Math.max(0, currentPlayer.cards - 1);

            // 记录日志
            logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）在水道桥丢弃了道具${item.name}`);

            // 显示消息
            elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}在水道桥丢弃了道具${item.name}！`;

            // 移除对话框
            document.body.removeChild(waterwayDialog);

            // 更新UI
            updateUI();
        });
    });

    // 处理取消按钮
    const cancelButton = waterwayDialog.querySelector('.cancel-waterway');
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(waterwayDialog);
    });
}

// 显示咖啡厅弹窗
function showCoffeeShopDialog() {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    // 创建弹出框
    const coffeeShopDialog = document.createElement('div');
    coffeeShopDialog.className = 'station-dialog';

    // 从模板加载HTML内容
    const templatesIframe = document.getElementById('templates-iframe');
    let template = null;
    if (templatesIframe && templatesIframe.contentDocument) {
        template = templatesIframe.contentDocument.getElementById('coffee-shop-dialog-template');
    }
    if (!template) {
        template = document.getElementById('coffee-shop-dialog-template');
    }
    if (template) {
        coffeeShopDialog.innerHTML = template.innerHTML;
        // 根据玩家角色动态调整蛋包饭选项的显示
        const currentPlayer = gameState.players[gameState.currentPlayer];
        if (currentPlayer.role !== '川濑') {
            const eggOption = coffeeShopDialog.querySelector('.coffee-shop-option[data-item="蛋包饭"]');
            if (eggOption) {
                eggOption.style.display = 'none';
            }
        }
    }

    document.body.appendChild(coffeeShopDialog);

    // 处理道具选择
    const optionElements = coffeeShopDialog.querySelectorAll('.coffee-shop-option');
    optionElements.forEach(optionElement => {
        optionElement.addEventListener('click', () => {
            const targetItemName = optionElement.dataset.item;
            const currentPlayer = gameState.players[gameState.currentPlayer];

            // 检查目标道具是否存在
            const targetItem = items[targetItemName];
            if (!targetItem) {
                elements.gameMessage.textContent = `${targetItemName}不存在！`;
                document.body.removeChild(coffeeShopDialog);
                return;
            }

            // 添加目标道具到玩家道具栏
            currentPlayer.items.push(targetItem);
            currentPlayer.cards++;

            // 记录日志
            logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）在咖啡厅使用钱置换了${targetItemName}`);

            // 显示消息
            elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}在咖啡厅使用钱置换了${targetItemName}！`;

            // 移除对话框
            document.body.removeChild(coffeeShopDialog);

            // 更新UI
            updateUI();

            // 处理行动后逻辑
            handlePostActionLogic(currentPlayer, gameState.currentPlayer);
        });
    });

    // 处理取消按钮
    const cancelButton = coffeeShopDialog.querySelector('.cancel-coffee-shop');
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(coffeeShopDialog);
    });
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

    // 检查是否处于停滞状态
    if (gameState.stagnantTurn !== -1) {
        elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}处于停滞状态，无法掷骰子！`;
        logEvent(`玩家${gameState.currentPlayer + 1}处于停滞状态，无法掷骰子`);
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
    // 标记本回合已行动
    currentPlayer.hasActed = true;
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
    // 创建日志对象
    const logObject = {
        timestamp: new Date().toISOString(),
        message: message
    };

    // 存储到游戏状态中
    gameState.logs.push(logObject);

    // 在UI上显示
    const logEntry = document.createElement('p');
    logEntry.textContent = message;
    elements.logContent.appendChild(logEntry);
    elements.logContent.scrollTop = elements.logContent.scrollHeight;
}

// 处理道具取消使用
function handleItemCancel(player, playerIndex, item) {
    // 恢复行动点
    player.action++;
    // 记录取消使用道具的日志
    logEvent(`玩家${playerIndex + 1}（${player.role}）取消使用${item.name}，行动点不变`);
    // 显示消息
    elements.gameMessage.textContent = `玩家取消了道具使用，行动点不变！`;
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
        const targetPlayer = gameState.players[i];
        if (i !== playerIndex && targetPlayer.status === 'alive' && conditionFn(targetPlayer) && !targetPlayer.hasFrogManSkill) {
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
        // 处理道具取消
        handleItemCancel(player, playerIndex, item);
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
        // 检查是否在停滞格子上，并且停滞状态已设置
        const currentGrid = gridConfig[gameState.tokenPosition];
        if (!currentGrid.isStagnant || gameState.stagnantTurn === -1) {
            // 不在停滞格子上，或停滞状态未设置（同一回合内刚移动到停滞格子），重新启用掷骰子按钮
            elements.rollDice.disabled = false;
            elements.gameMessage.textContent = `玩家${playerIndex + 1}还有${player.action}点行动点，可以继续操作。`;
        } else {
            // 在停滞格子上，且停滞状态已设置（下一个玩家的停滞效果），保持掷骰子按钮禁用
            elements.rollDice.disabled = true;
        }
    }
}

// 移动棋子
function moveToken(steps, isFromDice = true) {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const startPosition = gameState.tokenPosition;
    const startGrid = gridConfig[startPosition];

    // 检查是否触发停滞效果（仅对骰子移动有效）
    let canMove = true;
    let isStagnant = false;
    if (isFromDice && startGrid.isStagnant && gameState.stagnantTurn !== -1) {
        elements.gameMessage.textContent = `棋子停留在停滞格子上，无法使用骰子离开！`;
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

        // 检查是否离开起点（梅钵堂）
        if (startGrid.name === '梅钵堂' && endGrid.name !== '梅钵堂') {
            gameState.hasLeftStart = true;
        }

        // 记录移动日志
        logEvent(`玩家${gameState.currentPlayer + 1}(${currentPlayer.role})${isFromDice ? '掷出' : '移动'}${steps}点，从${startGrid.id}.${startGrid.name}移动到${endGrid.id}.${endGrid.name}${gameState.reverseDirection ? '（逆转方向）' : ''}`);

        // 检查是否离开停滞格子
        if (startGrid.isStagnant && !endGrid.isStagnant) {
            // 如果使用非骰子方式离开停滞格子，清除停滞状态
            if (!isFromDice) {
                gameState.stagnantTurn = -1;
                logEvent(`棋子通过非骰子方式离开停滞格子，停滞效果解除`);
            }
            // 如果使用骰子方式离开停滞格子，也清除停滞状态
            // 因为停滞效果只在结束回合时生效，所以当前玩家可以在同一回合内离开停滞格子
            else {
                gameState.stagnantTurn = -1;
                logEvent(`棋子通过骰子方式离开停滞格子，停滞效果解除`);
            }
        }
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
                // 检查是否是念珠道具
                if (defenseItemName === '念珠') {
                    // 计算需要消耗的行动点
                    let requiredAction = 0;
                    if (targetPlayer.role !== '薰' && targetPlayer.role !== '水上') {
                        requiredAction = 1;
                    }

                    // 检查行动点是否足够
                    if (targetPlayer.action < requiredAction) {
                        // 行动点不足，防御不生效，直接死亡
                        // 移除防御道具
                        targetPlayer.items.splice(defenseIndex, 1);
                        targetPlayer.cards = Math.max(0, targetPlayer.cards - 1);

                        // 设置目标玩家为死亡
                        targetPlayer.status = 'die';
                        // 玩家死亡后丢失所有道具
                        const lostItems = targetPlayer.items.length;
                        targetPlayer.items = [];
                        targetPlayer.cards = 0;
                        logEvent(`玩家${targetPlayerIndex + 1}（${targetPlayer.role}）行动点不足，念珠防御不生效，被${item.name}杀死，丢失了${lostItems}个道具`);

                        // 显示消息
                        elements.gameMessage.textContent = `玩家${targetPlayerIndex + 1}（${targetPlayer.role}）行动点不足，念珠防御不生效，已被${item.name}杀死！`;
                    } else {
                        // 行动点足够，防御生效
                        // 移除防御道具
                        targetPlayer.items.splice(defenseIndex, 1);
                        targetPlayer.cards = Math.max(0, targetPlayer.cards - 1);

                        // 记录日志
                        logEvent(`玩家${targetPlayerIndex + 1}（${targetPlayer.role}）使用念珠抵御了杀害`);

                        // 显示消息
                        elements.gameMessage.textContent = `玩家${targetPlayerIndex + 1}（${targetPlayer.role}）使用念珠抵御了杀害！`;

                        // 消耗行动点
                        if (requiredAction > 0) {
                            targetPlayer.action -= requiredAction;
                            logEvent(`玩家${targetPlayerIndex + 1}（${targetPlayer.role}）使用念珠抵御杀害，扣除${requiredAction}点行动点`);
                        }
                    }
                } else {
                    // 其他防御道具正常处理
                    // 移除防御道具
                    targetPlayer.items.splice(defenseIndex, 1);
                    targetPlayer.cards = Math.max(0, targetPlayer.cards - 1);

                    // 记录日志
                    logEvent(`玩家${targetPlayerIndex + 1}（${targetPlayer.role}）使用${defenseItemName}抵御了杀害`);

                    // 显示消息
                    elements.gameMessage.textContent = `玩家${targetPlayerIndex + 1}（${targetPlayer.role}）使用${defenseItemName}抵御了杀害！`;
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
                // 玩家死亡后丢失所有道具
                const lostItems = targetPlayer.items.length;
                targetPlayer.items = [];
                targetPlayer.cards = 0;
                logEvent(`玩家${targetPlayerIndex + 1}（${targetPlayer.role}）被${item.name}杀死，丢失了${lostItems}个道具`);

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

    // 处理市营电车站格子 - 可点击
    if (currentGrid.name === '市营电车站') {
        const currentStation = document.querySelector(`.grid-${gameState.tokenPosition}`);
        if (currentStation) {
            currentStation.classList.add('clickable');
            currentStation.onclick = function () {
                showStationDialog();
            };
        }
    } else {
        // 移除其他格子的点击状态
        const stationGrids = document.querySelectorAll('.grid-station.clickable');
        stationGrids.forEach(grid => {
            grid.classList.remove('clickable');
            grid.onclick = null;
        });
    }

    // 处理水道桥和吾妻桥格子 - 可点击
    if (currentGrid.name === '水道桥' || currentGrid.name === '吾妻桥') {
        const currentWaterway = document.querySelector(`.grid-${gameState.tokenPosition}`);
        if (currentWaterway) {
            currentWaterway.classList.add('clickable');
            currentWaterway.onclick = function () {
                showWaterwayDialog();
            };
        }
    } else if (currentGrid.name === '咖啡厅') {
        // 处理咖啡厅格子 - 可点击
        const currentCoffeeShop = document.querySelector(`.grid-${gameState.tokenPosition}`);
        if (currentCoffeeShop) {
            currentCoffeeShop.classList.add('clickable');
            currentCoffeeShop.onclick = function () {
                showCoffeeShopDialog();
            };
        }
    } else {
        // 移除其他格子的点击状态
        const waterwayGrids = document.querySelectorAll('.grid-mechanical-bath.clickable');
        waterwayGrids.forEach(grid => {
            grid.classList.remove('clickable');
            grid.onclick = null;
        });
    }

    // 使用策略模式处理格子效果
    const strategies = GridStrategyFactory.getStrategies(currentGrid);

    // 梅钵堂格子特殊处理：初始出发时不触发效果，仅在出发后踩中时触发
    if (currentGrid.name === '梅钵堂' && gameState.gameStarted) {
        // 检查是否是游戏开始后的第一次移动
        if (!gameState.hasLeftStart) {
            // 第一次离开起点，设置标志
            gameState.hasLeftStart = true;
        } else {
            // 已经离开过起点，触发效果
            strategies.forEach(strategy => {
                strategy.execute(currentGrid, currentPlayer);
            });
        }
    } else {
        // 其他格子正常处理
        strategies.forEach(strategy => {
            strategy.execute(currentGrid, currentPlayer);
        });
    }

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

// 显示胜利弹窗
function showWinDialog(winner) {
    // 创建弹窗
    const winDialog = document.createElement('div');
    winDialog.className = 'win-dialog';

    // 从模板加载HTML内容
    const templatesIframe = document.getElementById('templates-iframe');
    let template = null;
    if (templatesIframe && templatesIframe.contentDocument) {
        template = templatesIframe.contentDocument.getElementById('win-dialog-template');
    }
    if (!template) {
        template = document.getElementById('win-dialog-template');
    }
    if (template) {
        winDialog.innerHTML = template.innerHTML;
        // 设置胜利者名称
        const winnerNameElement = winDialog.querySelector('#winner-name');
        if (winnerNameElement) {
            winnerNameElement.textContent = winner;
        }
    }

    document.body.appendChild(winDialog);

    // 处理关闭按钮
    const closeButton = winDialog.querySelector('.close-win-dialog');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(winDialog);
    });
}

// 检查胜利条件
function checkWinCondition() {
    const playerCount = gameState.players.length;
    // 检查A玩家是否好感度达到100
    const winningPlayers = [];
    for (let i = 0; i < playerCount; i++) {
        const player = gameState.players[i];
        if (player.type === 'A' && player.favor >= 100) {
            winningPlayers.push({ index: i + 1, role: player.role, name: player.name });
        }
    }

    // 如果有多个A类型玩家达到胜利条件，宣布他们同时胜利
    if (winningPlayers.length > 0) {
        let winnerText = '';
        let winnerNames = '';
        for (let i = 0; i < winningPlayers.length; i++) {
            const player = winningPlayers[i];
            winnerText += `玩家${player.index}（${player.role}）`;
            if (i < winningPlayers.length - 1) {
                winnerText += '、';
            }
            winnerNames += `玩家${player.index}（${player.role}）`;
            if (i < winningPlayers.length - 1) {
                winnerNames += '、';
            }
        }
        elements.gameMessage.textContent = `${winnerText}好感度达到100，游戏胜利！`;
        logEvent(`游戏胜利：${winnerText}好感度达到100`);
        gameState.gameWon = true;
        // 显示胜利弹窗
        showWinDialog(winnerNames);
        return true;
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
        elements.gameMessage.textContent = '所有发小已被杀死，薰胜利！';
        logEvent(`游戏胜利：所有发小已被杀死，薰胜利`);
        gameState.gameWon = true;
        // 显示胜利弹窗
        showWinDialog('薰');
        return true;
    }

    return false;
}

// 结束行动
function endTurn() {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）结束行动`);

    // 检查是否在停滞格子上
    const currentGrid = gridConfig[gameState.tokenPosition];
    if (currentGrid.isStagnant) {
        // 只有当停滞状态未设置时，才标记下一个玩家需要受到停滞影响
        // 这样每个停滞格子最多只会限制1个玩家的行动
        if (gameState.stagnantTurn === -1) {
            gameState.stagnantTurn = gameState.currentPlayer;
            logEvent(`棋子停留在停滞格子上，下一个玩家不可使用骰子离开`);
        } else {
            // 如果停滞状态已经设置，清除它，这样下一个玩家可以正常行动
            gameState.stagnantTurn = -1;
            logEvent(`棋子停留在停滞格子上，但停滞效果已解除，下一个玩家可以正常行动`);
        }
    } else {
        // 如果不在停滞格子上，清除停滞状态
        gameState.stagnantTurn = -1;
    }

    // 每个玩家行动结束后，回合数+1
    gameStateManager.setState('round', gameState.round + 1);

    nextPlayer();
}


// 切换到下一个玩家-准备阶段
function nextPlayer() {
    const playerCount = gameState.players.length;

    // 找到下一个存活的玩家
    let nextPlayerIndex;
    if (gameState.reverseDirection) {
        // 逆向顺序
        nextPlayerIndex = (gameState.currentPlayer - 1 + playerCount) % playerCount;
        while (gameState.players[nextPlayerIndex].status !== 'alive') {
            elements.gameMessage.textContent = `玩家${nextPlayerIndex + 1}已死亡，无法执行操作。`;
            logEvent(`玩家${nextPlayerIndex + 1}已死亡，无法执行操作`);
            nextPlayerIndex = (nextPlayerIndex - 1 + playerCount) % playerCount;
        }
    } else {
        // 顺向顺序
        nextPlayerIndex = (gameState.currentPlayer + 1) % playerCount;
        while (gameState.players[nextPlayerIndex].status !== 'alive') {
            elements.gameMessage.textContent = `玩家${nextPlayerIndex + 1}已死亡，无法执行操作。`;
            logEvent(`玩家${nextPlayerIndex + 1}已死亡，无法执行操作`);
            nextPlayerIndex = (nextPlayerIndex + 1) % playerCount;
        }
    }



    gameStateManager.setState('currentPlayer', nextPlayerIndex);
    // 更新UI显示
    updateUI();
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const maxCards = characterAttributes[currentPlayer.role].maxCards;

    // 重置本回合是否行动过字段
    currentPlayer.hasActed = false;

    // 如果游戏已胜利，直接返回
    if (gameState.gameWon) {
        elements.currentPlayerDisplay.textContent = gameState.currentPlayer + 1;
        elements.roundCount.textContent = gameState.round;
        return;
    }

    // 玩家行动开始时，从牌堆摸一张道具卡（如果手牌未达到上限）
    let itemMessage = '';
    // if (currentPlayer.cards < maxCards && gameState.itemPool.length > 0) {
    //     const randomIndex = Math.floor(Math.random() * gameState.itemPool.length);
    //     const itemName = gameState.itemPool[randomIndex];
    //     const item = items[itemName];

    //     // 从道具池中移除该道具
    //     gameState.itemPool.splice(randomIndex, 1);

    //     // 添加道具到玩家的道具数组
    //     currentPlayer.items.push(item);
    //     currentPlayer.cards++;

    //     itemMessage = `获得道具${item.name}，`;
    //     logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）行动开始，获得道具${item.name}`);

    //     // 更新道具池显示
    //     updateItemPoolDisplay();
    // }

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

    // 检查当前格子是否为停滞格子
    const currentGrid = gridConfig[gameState.tokenPosition];
    if (currentGrid.isStagnant) {
        // 保持停滞状态，直到玩家结束回合或离开停滞格子
    } else {
        // 如果不在停滞格子上，清除停滞状态
        gameState.stagnantTurn = -1;
    }

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

    // 显示行动开始弹窗
    showActionStartDialog();
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
    gameState.hasLeftStart = false; // 重置离开起点标志
    gameState.logs = []; // 清空日志

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
    const logToggle = document.querySelector('.log-toggle');
    const logContent = document.querySelector('.log-content-container');
    const logResizer = document.querySelector('.log-resizer');

    let isDragging = false;
    let isResizing = false;
    let offsetX = 0;
    let offsetY = 0;
    let startHeight = 0;

    // 折叠/展开功能
    logToggle.addEventListener('click', function (e) {
        e.stopPropagation(); // 阻止事件冒泡，避免触发拖动
        const isCollapsed = logContent.style.display === 'none';
        logContent.style.display = isCollapsed ? 'block' : 'none';
        logToggle.classList.toggle('collapsed');
        logElement.classList.toggle('collapsed', !isCollapsed);
    });

    // 移动功能
    logHeader.addEventListener('mousedown', function (e) {
        isDragging = true;
        isResizing = false;
        offsetX = e.clientX - logElement.getBoundingClientRect().left;
        offsetY = e.clientY - logElement.getBoundingClientRect().top;
        logElement.style.zIndex = '1000';
    });

    // 调整高度功能
    if (logResizer) {
        logResizer.addEventListener('mousedown', function (e) {
            e.stopPropagation(); // 阻止事件冒泡，避免触发拖动
            isResizing = true;
            isDragging = false;
            startHeight = logElement.offsetHeight;
            offsetY = e.clientY;
            logElement.style.zIndex = '1000';
            document.body.style.cursor = 'ns-resize';
        });
    }

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
        } else if (isResizing) {
            const gameContainer = document.querySelector('.game-container');
            const containerRect = gameContainer.getBoundingClientRect();
            
            let deltaY = e.clientY - offsetY;
            let newHeight = startHeight + deltaY;
            
            // 限制最小和最大高度
            const minHeight = 40; // 折叠状态的高度
            const maxHeight = containerRect.height - logElement.getBoundingClientRect().top + containerRect.top - 20;
            
            newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
            
            logElement.style.height = newHeight + 'px';
            logElement.style.maxHeight = 'none'; // 取消最大高度限制
        }
    });

    document.addEventListener('mouseup', function () {
        isDragging = false;
        isResizing = false;
        logElement.style.zIndex = '100';
        document.body.style.cursor = '';
    });
}

// 随机分配角色
function randomRoles() {
    const playerCount = parseInt(document.getElementById('player-count').value) || 3;
    const roles = ['水上', '川濑', '花泽', '博士', '薰', '店主'];

    // 打乱角色顺序
    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // 分配角色给玩家
    for (let i = 1; i <= playerCount; i++) {
        const role = roles[(i - 1) % roles.length];
        const playerRoleSelect = document.getElementById(`player${i}-role`);

        if (playerRoleSelect) {
            playerRoleSelect.value = role;
        }
    }
}

// 处理玩家数量变化
function handlePlayerCountChange() {
    let playerCount = parseInt(document.getElementById('player-count').value) || 3;

    // 确保playerCount在3-5之间
    if (playerCount < 3) {
        playerCount = 3;
        document.getElementById('player-count').value = 3;
    } else if (playerCount > 5) {
        playerCount = 5;
        document.getElementById('player-count').value = 5;
    }

    // 显示或隐藏玩家设置
    for (let i = 1; i <= 5; i++) {
        const playerInput = document.querySelector(`.player-input:nth-child(${i})`);
        if (playerInput) {
            playerInput.style.display = i <= playerCount ? 'block' : 'none';
        }
    }

    // 显示或隐藏玩家信息
    for (let i = 1; i <= 5; i++) {
        const playerInfo = document.querySelector(`.player.player${i}`);
        if (playerInfo) {
            playerInfo.style.display = i <= playerCount ? '' : 'none';
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
        gameState.puddleCount = previousState.puddleCount;

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

    // 检查角色是否为花泽或薰
    if (currentPlayer.role !== '花泽' && currentPlayer.role !== '薰') {
        elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）无法执行杀人操作，只有花泽和薰可以杀人！`;
        logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）尝试杀人，但只有花泽和薰可以杀人`);
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
                // 检查是否是念珠道具
                if (defenseItemName === '念珠') {
                    // 计算需要消耗的行动点
                    let requiredAction = 0;
                    if (targetPlayer.role !== '薰' && targetPlayer.role !== '水上') {
                        requiredAction = 1;
                    }

                    // 检查行动点是否足够
                    if (targetPlayer.action < requiredAction) {
                        // 行动点不足，防御不生效，直接死亡
                        // 移除防御道具
                        targetPlayer.items.splice(defenseIndex, 1);
                        targetPlayer.cards = Math.max(0, targetPlayer.cards - 1);

                        // 设置目标玩家为死亡
                        targetPlayer.status = 'die';
                        // 玩家死亡后丢失所有道具
                        const lostItems = targetPlayer.items.length;
                        targetPlayer.items = [];
                        targetPlayer.cards = 0;
                        logEvent(`玩家${targetPlayerIndex + 1}（${targetPlayer.role}）行动点不足，念珠防御不生效，被杀死，丢失了${lostItems}个道具`);

                        // 显示消息
                        elements.gameMessage.textContent = `玩家${targetPlayerIndex + 1}（${targetPlayer.role}）行动点不足，念珠防御不生效，已被杀死！`;
                    } else {
                        // 行动点足够，防御生效
                        // 移除防御道具
                        targetPlayer.items.splice(defenseIndex, 1);
                        targetPlayer.cards = Math.max(0, targetPlayer.cards - 1);

                        // 记录日志
                        logEvent(`玩家${targetPlayerIndex + 1}（${targetPlayer.role}）使用念珠抵御了杀害`);

                        // 显示消息
                        elements.gameMessage.textContent = `玩家${targetPlayerIndex + 1}（${targetPlayer.role}）使用念珠抵御了杀害！`;

                        // 消耗行动点
                        if (requiredAction > 0) {
                            targetPlayer.action -= requiredAction;
                            logEvent(`玩家${targetPlayerIndex + 1}（${targetPlayer.role}）使用念珠抵御杀害，扣除${requiredAction}点行动点`);
                        }
                    }
                } else {
                    // 其他防御道具正常处理
                    // 移除防御道具
                    targetPlayer.items.splice(defenseIndex, 1);
                    targetPlayer.cards = Math.max(0, targetPlayer.cards - 1);

                    // 记录日志
                    logEvent(`玩家${targetPlayerIndex + 1}（${targetPlayer.role}）使用${defenseItemName}抵御了杀害`);

                    // 显示消息
                    elements.gameMessage.textContent = `玩家${targetPlayerIndex + 1}（${targetPlayer.role}）使用${defenseItemName}抵御了杀害！`;
                }
            } else {
                // 设置目标玩家为死亡
                targetPlayer.status = 'die';
                // 玩家死亡后丢失所有道具
                const lostItems = targetPlayer.items.length;
                targetPlayer.items = [];
                targetPlayer.cards = 0;
                logEvent(`玩家${targetPlayerIndex + 1}（${targetPlayer.role}）被杀死，丢失了${lostItems}个道具`);

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

    // 添加道具到玩家的道具数组，并标记为当前回合获得的道具
    const itemWithTurn = { ...item, obtainedTurn: gameState.round, obtainedBy: 'draw' };
    currentPlayer.items.push(itemWithTurn);
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

    // 监控道具池状态
    monitorItemPool();
}

// 事件监听器将在window.onload中添加

// 解析CSV数据的辅助函数
function parseCSV(csvText) {
    const lines = [];
    let currentLine = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;

    while (i < csvText.length) {
        const char = csvText[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            currentLine.push(currentField);
            currentField = '';
        } else if (char === '\n' && !inQuotes) {
            currentLine.push(currentField);
            lines.push(currentLine);
            currentLine = [];
            currentField = '';
        } else {
            currentField += char;
        }
        i++;
    }

    // 添加最后一行
    if (currentField || currentLine.length > 0) {
        currentLine.push(currentField);
        lines.push(currentLine);
    }

    return lines;
}

// 加载游戏日志
async function loadEditLog() {
    try {
        const response = await fetch('editLog.csv');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const csvText = await response.text();

        // 解析CSV数据
        const lines = parseCSV(csvText);
        const logBody = document.getElementById('edit-log-body');
        logBody.innerHTML = '';

        // 跳过表头行
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i];
            if (values.length >= 2) {
                const updateContent = values[0];
                const updateDate = values[1];

                // 创建表格行
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${updateContent}</td>
                    <td>${updateDate}</td>
                `;
                logBody.appendChild(row);
            }
        }
    } catch (error) {
        console.log('加载游戏日志失败:', error);
        // 显示默认日志
        const logBody = document.getElementById('edit-log-body');
        logBody.innerHTML = `
            <tr>
                <td>游戏日志文件未找到</td>
                <td>-</td>
            </tr>
        `;
    }
}

// 初始化页面
window.onload = async function () {
    // 初始化DOM元素
    initElements();

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
    
    const mapLoadButton = document.getElementById('load-map');
    if (mapLoadButton) {
        mapLoadButton.addEventListener('click', loadMapFromFile);
    }
    
    const fantasySkillsLoadButton = document.getElementById('load-fantasy-skills');
    if (fantasySkillsLoadButton) {
        fantasySkillsLoadButton.addEventListener('click', loadFantasySkillsFromFile);
    }

    // 添加玩家数量变化事件监听器
    document.getElementById('player-count').addEventListener('change', handlePlayerCountChange);

    // 添加随机分配角色按钮的事件监听器
    document.getElementById('random-roles').addEventListener('click', randomRoles);

    // 添加开始游戏按钮的事件监听器
    document.getElementById('start-game').addEventListener('click', initGame);

    // 添加下载道具模板按钮的事件监听器
    document.getElementById('download-item-template').addEventListener('click', downloadItemTemplate);

    // 添加下载地图模板按钮的事件监听器
    document.getElementById('download-map-template').addEventListener('click', downloadMapTemplate);
    
    // 添加下载幻象技模板按钮的事件监听器
    document.getElementById('download-fantasy-skill-template').addEventListener('click', downloadFantasySkillTemplate);
    


    // 添加游戏控制按钮的事件监听器
    const rollDiceButton = document.getElementById('roll-dice');
    if (rollDiceButton) {
        rollDiceButton.addEventListener('click', rollDice);
    }

    const resetGameButton = document.getElementById('reset-game');
    if (resetGameButton) {
        resetGameButton.addEventListener('click', async () => {
            await resetGame();
        });
    }

    const undoActionButton = document.getElementById('undo-action');
    if (undoActionButton) {
        undoActionButton.addEventListener('click', undoAction);
    }

    const killPlayerButton = document.getElementById('kill-player');
    if (killPlayerButton) {
        killPlayerButton.addEventListener('click', killPlayer);
    }

    const drawCardButton = document.getElementById('draw-card');
    if (drawCardButton) {
        drawCardButton.addEventListener('click', drawCard);
    }

    const saveGameButton = document.getElementById('save-game');
    if (saveGameButton) {
        saveGameButton.addEventListener('click', saveGameToLocalStorage);
    }

    const loadGameButton = document.getElementById('load-game');
    if (loadGameButton) {
        loadGameButton.addEventListener('click', loadGameFromLocalStorage);
    }

    const exportSaveButton = document.getElementById('export-save');
    if (exportSaveButton) {
        exportSaveButton.addEventListener('click', exportSaveToFile);
    }

    const importSaveButton = document.getElementById('import-save');
    if (importSaveButton) {
        importSaveButton.addEventListener('click', importSaveFromFile);
    }

    const endTurnButton = document.getElementById('end-turn');
    if (endTurnButton) {
        endTurnButton.addEventListener('click', endTurn);
    }

    // 初始化玩家数量显示
    handlePlayerCountChange();

    // 加载游戏日志
    await loadEditLog();

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
    
    // 尝试自动加载幻象技
    const loadedFantasySkills = await autoLoadFantasySkillsFromCSV();
    if (!loadedFantasySkills) {
        updateFantasySkillLoadStatus('未加载，请选择文件');
    }

    // 初始化道具池监控
    monitorItemPool();
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

// 下载道具模板
function downloadItemTemplate() {
    // 创建一个a标签
    const link = document.createElement('a');
    link.href = 'item.csv';
    link.download = 'item.csv';
    link.click();
}

// 下载地图模板
function downloadMapTemplate() {
    // 创建一个a标签
    const link = document.createElement('a');
    link.href = 'map.csv';
    link.download = 'map.csv';
    link.click();
}

// 下载幻象技模板
function downloadFantasySkillTemplate() {
    // 创建一个a标签
    const link = document.createElement('a');
    link.href = 'fantasySkill.csv';
    link.download = 'fantasySkill.csv';
    link.click();
}

// 刷新道具池
function refreshItemPool() {
    if (gameState.itemPool.length === 0) {
        // 重新补充道具池
        gameState.itemPool = [...itemPool];
        logEvent(`道具池已空，自动刷新道具池`);
        elements.gameMessage.textContent = `道具池已空，已自动刷新道具池！`;
        // 更新道具池显示
        updateItemPoolDisplay();
    }
}

// 监听道具池状态
function monitorItemPool() {
    // 检查道具池是否为空
    if (gameState.itemPool.length === 0) {
        refreshItemPool();
    }
}

// 显示行动开始弹窗
function showActionStartDialog() {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const maxCards = characterAttributes[currentPlayer.role].maxCards;

    // 创建弹窗
    const dialog = document.createElement('div');
    dialog.className = 'action-start-dialog';
    dialog.style.cssText = `
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
    `;

    // 检查是否受停滞格子影响
    const currentGrid = gridConfig[gameState.tokenPosition];
    const isStagnant = currentGrid.isStagnant && gameState.stagnantTurn !== -1;

    // 检查场上是否存在店主
    const shopkeeper = gameState.players.find(player => player.role === '店主' && player.status === 'alive');
    const hasShopkeeper = shopkeeper !== undefined;
    const shopkeeperHasSkills = hasShopkeeper && shopkeeper.fantasySkills && shopkeeper.fantasySkills.length > 0;

    // 检查是否需要禁用店主幻象技按钮
    const disableShopkeeperSkillButton = (!hasShopkeeper || !shopkeeperHasSkills) || (currentPlayer.hasActed && currentPlayer.role !== '店主');

    // 弹窗内容
    const dialogContent = document.createElement('div');
    dialogContent.style.cssText = `
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    `;

    dialogContent.innerHTML = `
        <h3>玩家${gameState.currentPlayer + 1}行动开始</h3>
        <p>角色：${currentPlayer.role}</p>
        ${isStagnant ? '<p style="color: red;">当前处于停滞状态，无法移动</p>' : '<p>是否进行一次不消耗行动点的掷骰子？</p>'}
        <div id="action-start-result" style="margin: 15px 0; padding: 10px; background-color: #f0f0f0; border-radius: 4px;"></div>
        <div style="margin-top: 20px;">
            ${isStagnant ?
            '<button id="action-start-cannot-move" style="padding: 10px 20px; margin: 5px; background-color: #ccc; color: white; border: none; border-radius: 4px; cursor: pointer;">不可移动</button>' :
            '<button id="action-start-roll-dice" style="padding: 10px 20px; margin: 5px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">掷骰子（不消耗行动点）</button>'
        }
            <button id="action-start-draw-card" style="padding: 10px 20px; margin: 5px; background-color: ${currentPlayer.cards >= maxCards || gameState.itemPool.length <= 0 ? '#ccc' : '#2196F3'}; color: white; border: none; border-radius: 4px; cursor: ${currentPlayer.cards >= maxCards || gameState.itemPool.length <= 0 ? 'not-allowed' : 'pointer'};" ${currentPlayer.cards >= maxCards || gameState.itemPool.length <= 0 ? 'disabled' : ''}>抽牌（不消耗行动点）</button>
            ${hasShopkeeper ? '<button id="action-start-shopkeeper-skill" style="padding: 10px 20px; margin: 5px; background-color: ' + (disableShopkeeperSkillButton ? '#ccc' : '#ff9800') + '; color: white; border: none; border-radius: 4px; cursor: ' + (disableShopkeeperSkillButton ? 'not-allowed' : 'pointer') + ';" ' + (disableShopkeeperSkillButton ? 'disabled' : '') + '>店主是否使用幻象技</button>' : ''}
            <button id="action-start-confirm" style="padding: 10px 20px; margin: 5px; background-color: #9c27b0; color: white; border: none; border-radius: 4px; cursor: pointer; display: none;">确认</button>
        </div>
    `;

    dialog.appendChild(dialogContent);
    document.body.appendChild(dialog);

    // 状态变量
    let diceRoll = null;
    let drawnItem = null;

    // 处理按钮点击
    if (isStagnant) {
        // 不可移动按钮
        document.getElementById('action-start-cannot-move').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    } else {
        // 掷骰子按钮
        const rollDiceButton = document.getElementById('action-start-roll-dice');
        rollDiceButton.addEventListener('click', () => {
            // 进行一次不消耗行动点的掷骰子
            diceRoll = Math.floor(Math.random() * 6) + 1;

            // 标记本回合已行动
            currentPlayer.hasActed = true;

            // 显示骰子点数
            document.getElementById('action-start-result').textContent = `骰子点数：${diceRoll}`;

            // 禁用掷骰子按钮
            rollDiceButton.disabled = true;
            rollDiceButton.style.backgroundColor = '#ccc';
            rollDiceButton.style.cursor = 'not-allowed';

            // 更新店主幻象技按钮状态
            updateShopkeeperSkillButton();

            // 检查是否需要显示确认按钮
            checkShowConfirmButton();
        });
    }

    // 抽牌按钮（如果存在）
    const drawCardButton = document.getElementById('action-start-draw-card');
    if (drawCardButton) {
        drawCardButton.addEventListener('click', () => {
            // 检查是否可以抽牌
            if (currentPlayer.cards < maxCards && gameState.itemPool.length > 0) {
                // 标记本回合已行动
                currentPlayer.hasActed = true;

                // 从道具池中随机抽取一张道具卡
                const randomIndex = Math.floor(Math.random() * gameState.itemPool.length);
                const itemName = gameState.itemPool[randomIndex];
                drawnItem = items[itemName];

                // 从道具池中移除该道具
                gameState.itemPool.splice(randomIndex, 1);

                // 添加道具到玩家的道具数组
                currentPlayer.items.push(drawnItem);
                currentPlayer.cards++;

                // 显示获得的道具
                document.getElementById('action-start-result').textContent = `获得道具：${drawnItem.name}`;
                elements.gameMessage.textContent = `玩家${gameState.currentPlayer + 1}获得道具${drawnItem.name}！`;
                logEvent(`玩家${gameState.currentPlayer + 1}（${currentPlayer.role}）行动开始，获得道具${drawnItem.name}`);

                // 更新道具池显示
                updateItemPoolDisplay();

                // 禁用抽牌按钮
                drawCardButton.disabled = true;
                drawCardButton.style.backgroundColor = '#ccc';
                drawCardButton.style.cursor = 'not-allowed';

                // 更新店主幻象技按钮状态
                updateShopkeeperSkillButton();

                // 检查是否需要显示确认按钮
                checkShowConfirmButton();
            }
        });
    }

    // 店主幻象技按钮
    const shopkeeperSkillButton = document.getElementById('action-start-shopkeeper-skill');
    if (shopkeeperSkillButton) {
        shopkeeperSkillButton.addEventListener('click', () => {
            // 显示店主幻象技选择弹窗
            showShopkeeperSkillDialog(shopkeeper, dialog);
        });
    }

    // 确认按钮
    const confirmButton = document.getElementById('action-start-confirm');
    confirmButton.addEventListener('click', () => {
        // 如果有骰子点数，执行移动
        if (diceRoll !== null) {
            // 保存当前行动点
            const currentActionPoints = currentPlayer.action;

            // 执行移动
            moveToken(diceRoll);

            // 恢复行动点
            currentPlayer.action = currentActionPoints;
        }

        // 关闭弹窗
        document.body.removeChild(dialog);
    });

    // 检查是否需要显示确认按钮
    function checkShowConfirmButton() {
        const rollDiceButton = document.getElementById('action-start-roll-dice');
        const drawCardButton = document.getElementById('action-start-draw-card');
        const confirmButton = document.getElementById('action-start-confirm');

        // 检查是否处于停滞状态或两个按钮都不可点击
        const isRollDiceDisabled = isStagnant || (rollDiceButton && rollDiceButton.disabled);
        const isDrawCardDisabled = drawCardButton && (drawCardButton.disabled || currentPlayer.cards >= maxCards || gameState.itemPool.length <= 0);

        if (isRollDiceDisabled && isDrawCardDisabled) {
            confirmButton.style.display = 'inline-block';
        }
    }

    // 检查并更新店主幻象技按钮状态
    function updateShopkeeperSkillButton() {
        const shopkeeperSkillButton = document.getElementById('action-start-shopkeeper-skill');
        if (shopkeeperSkillButton) {
            // 重新计算是否需要禁用店主幻象技按钮
            const updatedDisableShopkeeperSkillButton = (!hasShopkeeper || !shopkeeperHasSkills) || (currentPlayer.hasActed && currentPlayer.role !== '店主');
            
            if (updatedDisableShopkeeperSkillButton) {
                shopkeeperSkillButton.disabled = true;
                shopkeeperSkillButton.style.backgroundColor = '#ccc';
                shopkeeperSkillButton.style.cursor = 'not-allowed';
            } else {
                shopkeeperSkillButton.disabled = false;
                shopkeeperSkillButton.style.backgroundColor = '#ff9800';
                shopkeeperSkillButton.style.cursor = 'pointer';
            }
        }
    }

    // 初始检查
    checkShowConfirmButton();
}

// 显示店主幻象技选择弹窗
function showShopkeeperSkillDialog(shopkeeper, parentDialog) {
    // 创建弹窗
    const dialog = document.createElement('div');
    dialog.className = 'shopkeeper-skill-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
    `;

    // 弹窗内容
    const dialogContent = document.createElement('div');
    dialogContent.style.cssText = `
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        max-width: 400px;
    `;

    // 构建幻象技列表
    let skillsHTML = '';
    shopkeeper.fantasySkills.forEach((skill, index) => {
        const isUsed = skill.used || false;
        skillsHTML += `
            <div class="skill-item" style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; ${isUsed ? 'background-color: #f0f0f0; opacity: 0.7;' : ''}">
                <h4 style="margin: 0 0 5px 0;">${skill.name}</h4>
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">${skill.description}</p>
                <button class="use-skill-button" data-skill-index="${index}" style="padding: 5px 10px; background-color: ${isUsed ? '#ccc' : '#4CAF50'}; color: white; border: none; border-radius: 4px; cursor: ${isUsed ? 'not-allowed' : 'pointer'};" ${isUsed ? 'disabled' : ''}>
                    ${isUsed ? '已使用' : '使用幻象技'}
                </button>
            </div>
        `;
    });

    dialogContent.innerHTML = `
        <h3>店主幻象技选择</h3>
        <p>请选择要使用的幻象技：</p>
        <div class="skills-list" style="margin: 20px 0;">
            ${skillsHTML}
        </div>
        <button id="cancel-skill-button" style="padding: 10px 20px; margin: 5px; background-color: #9c27b0; color: white; border: none; border-radius: 4px; cursor: pointer;">取消</button>
    `;

    dialog.appendChild(dialogContent);
    document.body.appendChild(dialog);

    // 处理使用技能按钮点击
    const useSkillButtons = dialog.querySelectorAll('.use-skill-button');
    useSkillButtons.forEach(button => {
        button.addEventListener('click', () => {
            const skillIndex = parseInt(button.dataset.skillIndex);
            const skill = shopkeeper.fantasySkills[skillIndex];

            // 标记技能为已使用
            skill.used = true;

            // 触发技能效果
            triggerShopkeeperSkill(skill, shopkeeper);

            // 关闭当前弹窗，返回行动开始弹窗
            document.body.removeChild(dialog);



            // 更新行动开始弹窗中的店主幻象技按钮状态
            const shopkeeperSkillButton = parentDialog.querySelector('#action-start-shopkeeper-skill');
            if (shopkeeperSkillButton) {
                // 重新检查是否需要禁用店主幻象技按钮
                const currentPlayer = gameState.players[gameState.currentPlayer];
                const hasAvailableSkills = shopkeeper.fantasySkills.some(skill => !skill.used);
                const shouldDisable = !hasAvailableSkills || (currentPlayer.hasActed && currentPlayer.role !== '店主');
                
                if (shouldDisable) {
                    shopkeeperSkillButton.disabled = true;
                    shopkeeperSkillButton.style.backgroundColor = '#ccc';
                    shopkeeperSkillButton.style.cursor = 'not-allowed';
                } else {
                    shopkeeperSkillButton.disabled = false;
                    shopkeeperSkillButton.style.backgroundColor = '#ff9800';
                    shopkeeperSkillButton.style.cursor = 'pointer';
                }
            }

            // 检查是否需要显示确认按钮
            const confirmButton = parentDialog.querySelector('#action-start-confirm');
            const rollDiceButton = parentDialog.querySelector('#action-start-roll-dice');
            const drawCardButton = parentDialog.querySelector('#action-start-draw-card');

            const isRollDiceDisabled = rollDiceButton && rollDiceButton.disabled;
            const isDrawCardDisabled = drawCardButton && (drawCardButton.disabled || currentPlayer.cards >= characterAttributes[currentPlayer.role].maxCards || gameState.itemPool.length <= 0);

            if (isRollDiceDisabled && isDrawCardDisabled) {
                confirmButton.style.display = 'inline-block';
            }
        });
    });

    // 处理取消按钮点击
    document.getElementById('cancel-skill-button').addEventListener('click', () => {
        document.body.removeChild(dialog);
    });
}

// 辅助函数：获取店主索引
function getShopkeeperIndex(shopkeeper) {
    return gameState.players.indexOf(shopkeeper);
}

// 辅助函数：记录幻象技使用日志
function logSkillUsage(skill, shopkeeperIndex, extra = '') {
    logEvent(`玩家${shopkeeperIndex + 1}（店主）使用了幻象技${skill.name}${extra}`);
}

// 辅助函数：显示幻象技消息
function showSkillMessage(skill, shopkeeperIndex, message) {
    elements.gameMessage.textContent = `玩家${shopkeeperIndex + 1}（店主）${message}！`;
}

// 辅助函数：处理取消使用幻象技
function handleSkillCancel(skill, shopkeeperIndex) {
    logEvent(`玩家${shopkeeperIndex + 1}（店主）取消使用幻象技${skill.name}`);
    elements.gameMessage.textContent = `玩家${shopkeeperIndex + 1}（店主）取消使用幻象技${skill.name}！`;
}

// 辅助函数：过滤出有道具的其他存活玩家
function getPlayersWithItems(excludeIndex) {
    const players = [];
    gameState.players.forEach((targetPlayer, targetIndex) => {
        if (targetIndex !== excludeIndex && targetPlayer.status === 'alive' && targetPlayer.items.length > 0) {
            players.push(targetIndex);
        }
    });
    return players;
}

// 辅助函数：过滤出所有存活玩家
function getAllAlivePlayers() {
    const players = [];
    gameState.players.forEach((targetPlayer, targetIndex) => {
        if (targetPlayer.status === 'alive') {
            players.push(targetIndex);
        }
    });
    return players;
}

// 辅助函数：处理道具丢弃
function handleItemDrop(selectedItems, skill, shopkeeperIndex) {
    selectedItems.forEach((itemIndex, targetPlayerIndex) => {
        const targetPlayer = gameState.players[targetPlayerIndex];
        const droppedItem = targetPlayer.items[itemIndex];
        
        // 从目标玩家手中移除道具
        targetPlayer.items.splice(itemIndex, 1);
        targetPlayer.cards = Math.max(0, targetPlayer.cards - 1);
        
        // 记录日志
        logEvent(`玩家${shopkeeperIndex + 1}（店主）使用幻象技${skill.name}，强制玩家${targetPlayerIndex + 1}（${targetPlayer.role}）丢弃了道具${droppedItem.name}`);
    });
    
    showSkillMessage(skill, shopkeeperIndex, '使用了幻象技' + skill.name + '，强制' + selectedItems.size + '名玩家各丢弃了一张道具');
    
    // 更新UI
    updateUI();
}

// 辅助函数：处理道具夺取
function handleItemSteal(selectedItems, shopkeeper, skill, shopkeeperIndex) {
    selectedItems.forEach((itemIndex, targetPlayerIndex) => {
        const targetPlayer = gameState.players[targetPlayerIndex];
        const stolenItem = targetPlayer.items[itemIndex];
        
        // 从目标玩家手中移除道具
        targetPlayer.items.splice(itemIndex, 1);
        targetPlayer.cards = Math.max(0, targetPlayer.cards - 1);
        
        // 添加到当前玩家手中
        shopkeeper.items.push(stolenItem);
        shopkeeper.cards++;
        
        // 记录日志
        logEvent(`玩家${shopkeeperIndex + 1}（店主）使用幻象技${skill.name}，从玩家${targetPlayerIndex + 1}（${targetPlayer.role}）手中夺取了道具${stolenItem.name}`);
    });
    
    showSkillMessage(skill, shopkeeperIndex, '使用了幻象技' + skill.name + '，从' + selectedItems.size + '名玩家手中各夺取了一张道具');
    
    // 更新UI
    updateUI();
}

// 辅助函数：处理道具交换
function handleItemExchange(result, skill, shopkeeperIndex) {
    const { player1Index, player2Index, player1Items, player2Items } = result;
    const player1 = gameState.players[player1Index];
    const player2 = gameState.players[player2Index];
    
    // 获取要交换的道具
    const player1ExchangeItems = player1Items.map(idx => player1.items[idx]);
    const player2ExchangeItems = player2Items.map(idx => player2.items[idx]);
    
    // 从原玩家手中移除道具（从后往前删除，避免索引问题）
    player1Items.sort((a, b) => b - a).forEach(idx => {
        player1.items.splice(idx, 1);
    });
    player2Items.sort((a, b) => b - a).forEach(idx => {
        player2.items.splice(idx, 1);
    });
    
    // 将道具添加到对方手中
    player1.items.push(...player2ExchangeItems);
    player2.items.push(...player1ExchangeItems);
    
    // 更新手牌数
    player1.cards = player1.items.length;
    player2.cards = player2.items.length;
    
    // 记录日志
    const player1ItemNames = player1ExchangeItems.map(item => item.name).join('、');
    const player2ItemNames = player2ExchangeItems.map(item => item.name).join('、');
    
    logEvent(`玩家${shopkeeperIndex + 1}（店主）使用幻象技${skill.name}，玩家${player1Index + 1}（${player1.role}）的${player1ItemNames}与玩家${player2Index + 1}（${player2.role}）的${player2ItemNames}进行了交换`);
    
    showSkillMessage(skill, shopkeeperIndex, '使用了幻象技' + skill.name + '，交换完成');
    
    // 更新UI
    updateUI();
}

// 辅助函数：处理电光艇移动
function handleLightningBoatMove(totalSteps) {
    // 记录原始位置
    const originalPosition = gameState.tokenPosition;
    
    // 移动棋子
    if (gameState.reverseDirection) {
        // 逆时针移动
        gameState.tokenPosition = (gameState.tokenPosition - totalSteps + gridConfig.length) % gridConfig.length;
    } else {
        // 顺时针移动
        gameState.tokenPosition = (gameState.tokenPosition + totalSteps) % gridConfig.length;
    }
    
    // 更新棋子位置
    updateTokenPosition();
    
    // 触发格子效果
    const currentGrid = gridConfig[gameState.tokenPosition];
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const strategies = GridStrategyFactory.getStrategies(currentGrid);
    
    // 检查是否是水洼格子（会结束回合）
    const isWaterGrid = currentGrid.types && currentGrid.types.includes('水洼');
    
    strategies.forEach(strategy => {
        strategy.execute(currentGrid, currentPlayer);
    });
}

// 触发店主幻象技效果
function triggerShopkeeperSkill(skill, shopkeeper) {
    const shopkeeperIndex = getShopkeeperIndex(shopkeeper);
    
    // 根据技能名称触发不同的效果
    switch (skill.name) {
        case '蛙男':
            // 蛙男技能：全程不会成为其他角色强制丢弃道具或损耗行动点的对象
            shopkeeper.hasFrogManSkill = true;
            logSkillUsage(skill, shopkeeperIndex, '，全程不会成为其他角色强制丢弃道具或损耗行动点的对象');
            showSkillMessage(skill, shopkeeperIndex, '的幻象技' + skill.name + '生效');
            break;
        case '幸运草':
            // 幸运草技能：可以多抽一张道具卡
            if (shopkeeper.cards < characterAttributes[shopkeeper.role].maxCards && gameState.itemPool.length > 0) {
                const randomIndex = Math.floor(Math.random() * gameState.itemPool.length);
                const itemName = gameState.itemPool[randomIndex];
                const item = items[itemName];

                // 从道具池中移除该道具
                gameState.itemPool.splice(randomIndex, 1);

                // 添加道具到玩家的道具数组
                shopkeeper.items.push(item);
                shopkeeper.cards++;

                logSkillUsage(skill, shopkeeperIndex, '，获得道具' + item.name);
                showSkillMessage(skill, shopkeeperIndex, '使用了幻象技' + skill.name + '，获得道具' + item.name);

                // 更新道具池显示
                updateItemPoolDisplay();
            }
            break;
        case '晴彦':
            // 强制最多三名存活角色各丢弃一张道具卡（由你指定）
            logSkillUsage(skill, shopkeeperIndex);
            
            // 过滤出其他存活玩家
            const availablePlayers = getPlayersWithItems(shopkeeperIndex);
            
            if (availablePlayers.length === 0) {
                elements.gameMessage.textContent = '没有可丢弃道具的目标！';
                logSkillUsage(skill, shopkeeperIndex, '，但没有可丢弃道具的目标');
                return;
            }
            
            // 创建丢弃道具对话框
            GameDialogService.createDropItemDialog(
                availablePlayers,
                (selectedItems) => handleItemDrop(selectedItems, skill, shopkeeperIndex),
                () => handleSkillCancel(skill, shopkeeperIndex)
            );
            break;
        case '大蛇丸':
            // 从最多两名存活玩家手中各夺取一张道具卡（由你指定）
            logSkillUsage(skill, shopkeeperIndex);
            
            // 检查是否达到手牌上限
            const handLimit = characterAttributes[shopkeeper.role].maxCards;
            const currentHandCount = shopkeeper.items.length;
            const availableSlots = handLimit - currentHandCount;
            
            if (availableSlots <= 0) {
                elements.gameMessage.textContent = '你的手牌已达到上限，无法使用大蛇丸幻象技！';
                logSkillUsage(skill, shopkeeperIndex, '，但手牌已达到上限');
                return;
            }
            
            // 计算最多可以夺取的道具数量
            const maxStealCount = Math.min(2, availableSlots);
            
            // 过滤出其他存活玩家
            const stealablePlayers = getPlayersWithItems(shopkeeperIndex);
            
            if (stealablePlayers.length === 0) {
                elements.gameMessage.textContent = '没有可夺取道具的目标！';
                logSkillUsage(skill, shopkeeperIndex, '，但没有可夺取道具的目标');
                return;
            }
            
            // 创建夺取道具对话框
            GameDialogService.createStealItemDialog(
                stealablePlayers,
                maxStealCount,
                (selectedItems) => handleItemSteal(selectedItems, shopkeeper, skill, shopkeeperIndex),
                () => handleSkillCancel(skill, shopkeeperIndex)
            );
            break;
        case '帕诺拉马岛':
            // 交换在场任意两位存活角色的道具卡（交换数量需在角色的手牌上限内）
            logSkillUsage(skill, shopkeeperIndex);
            
            // 过滤出所有存活玩家
            const alivePlayers = getAllAlivePlayers();
            
            if (alivePlayers.length < 2) {
                elements.gameMessage.textContent = '存活玩家不足2人，无法使用帕诺拉马岛！';
                logSkillUsage(skill, shopkeeperIndex, '，但存活玩家不足2人');
                return;
            }
            
            // 创建交换道具对话框
            GameDialogService.createExchangeItemsDialog(
                alivePlayers,
                (result) => handleItemExchange(result, skill, shopkeeperIndex),
                () => handleSkillCancel(skill, shopkeeperIndex)
            );
            break;
        case '电光艇':
            // 电光艇技能：指定步数并x2
            logSkillUsage(skill, shopkeeperIndex);
            
            // 创建电光艇对话框
            GameDialogService.createLightningBoatDialog(
                (totalSteps) => handleLightningBoatMove(totalSteps),
                () => handleSkillCancel(skill, shopkeeperIndex)
            );
            break;
        // 可以添加其他技能的处理逻辑
        default:
            logSkillUsage(skill, shopkeeperIndex);
            showSkillMessage(skill, shopkeeperIndex, '使用了幻象技' + skill.name);
            break;
    }
}