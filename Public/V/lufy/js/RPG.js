var RPG = {

// RPG基本管理参数，根据不同项目，应当调整
    curBGM: {},
//方向常量
    DOWN: 0,
    LEFT: 1,
    RIGHT: 2,
    UP: 3,
// 地图单位
    STEP: 24,
    ctrState: 0,
//显示进度条所用层
    loadingLayer: {},
//游戏底层
    backLayer: {},
//地图层
    mapLayer: {},
//人物层
    charaLayer: {},
//效果层
    effectLayer: {},
//对话层（及菜单，战斗）
    talkLayer: {},
//子菜单层（多个菜单页）
    ctrlLayer: {},
    descLayer: new LSprite(),
// 状态控制
// 状态变量
    state: -1,
// 状态栈
    stateStack: [],
// 单值状态值
    IN_COVER: 0,           // 封面
    COVER_MENU: 1,         // 封面载入菜单
    MAP_CONTROL: 2,        // 正常控制
    MAP_WAITING: 3,        // 等待NPC移动，不可控制
    IN_MENU: 4,            // 菜单中
    IN_FIGHTING: 5,        // 在战斗菜单中
    IN_TALKING: 6,         // 对话状态中
    IN_CHOOSING: 7,        // 选择状态中
    IN_HELP: 8,            // 在帮助窗口下
    IN_OVER: 9,            // 在结束状态下
    FIGHT_RESULT: 10,      // 检查战斗结果（防止战斗异常重入）
// 组合状态，100以上
    UNDER_MAP: 101,        // 地图下，包括地图控制和地图等待
    UNDER_MENU: 102,       // 菜单下，包括主菜单和载入菜单
    UNDER_WINDOWS: 103,       // 各种窗口下，包括主菜单、载入菜单、战斗系统
    stateList: {
        101: [RPG.MAP_CONTROL, RPG.MAP_WAITING],
        102: [RPG.IN_MENU, RPG.COVER_MENU],
        103: [RPG.IN_MENU, RPG.COVER_MENU, RPG.IN_FIGHTING]
    },
// 流程控制:=============================================
// 内置开关量
    SWITCH: {},
// 敌人战队数据集合
    enemyTeam: [],
//======================================================================
// 按钮管理
    currentButton: null,
    // 存档信息
    saveList: [],
    MaxSaveSlot: 3,
// ==========================================================

    /**
     * // ECMAScript5 compatibility based on: http://www.nczonline.net/blog/2012/12/11/are-your-mixins-ecmascript-5-compatible/
     *
     * */
    extend: function (obj, source) {
        if (Object.keys) {
            let keys = Object.keys(source);
            for (let i = 0, il = keys.length; i < il; i++) {
                let prop = keys[i];
                Object.defineProperty(obj, prop, Object.getOwnPropertyDescriptor(source, prop));
            }
        } else {
            let safeHasOwnProperty = {}.hasOwnProperty;
            for (let prop in source) {
                if (safeHasOwnProperty.call(source, prop)) {
                    obj[prop] = source[prop];
                }
            }
        }
        return obj;
    },

    /**
     * based on https://github.com/documentcloud/underscore/blob/bf657be243a075b5e72acc8a83e6f12a564d8f55/underscore.js#L767
     *
     * beget继承方法
     *
     * */
    beget: function (o) {
        let F = function () {
        };
        F.prototype = o;
        let G = new F();
        if (G.init) {
            G.init();
        }
        return G;
    },


    Serialize: function (obj) {
        switch (obj.constructor) {
            case Object:
                var str = "{";
                for (var o in obj) {
                    var tmp = RPG.Serialize(obj[o]);
                    if (tmp) {
                        str += o + ":" + tmp + ",";
                    }
                }
                if (str.substr(str.length - 1) == ",")
                    str = str.substr(0, str.length - 1);
                return str + "}";
                break;
            case Array:
                var str = "[";
                for (var o in obj) {
                    var tmp = RPG.Serialize(obj[o]);
                    if (tmp) {
                        str += tmp + ",";
                    }
                }
                if (str.substr(str.length - 1) == ",")
                    str = str.substr(0, str.length - 1);
                return str + "]";
                break;
            case Boolean:
                return "\"" + obj.toString() + "\"";
                break;
            case Date:
                return "\"" + obj.toString() + "\"";
                break;
            case Function:
                break;
            case Number:
                return "\"" + obj.toString() + "\"";
                break;
            case String:
                return "\"" + obj.toString() + "\"";
                break;
        }
    },

    setState: function (state) {
        RPG.stateStack.length = 0;
        RPG.pushState(state);
    },
    pushState: function (state) {
        RPG.stateStack.push(state);
        RPG.state = state;
    },
    popState: function () {
        RPG.stateStack.pop();
        RPG.state = RPG.stateStack[RPG.stateStack.length - 1];
    },
    checkState: function (state) {
        if (state < 50) {
            if(RPG.state === state) return true;
            return false;
        } else {
            let stateSet = RPG.stateList[state];
            if (!stateSet) return false;

            for (let i = 0; i < stateSet.length; i++) {
                if (RPG.state === stateSet[i]) return true;
            }
            return false;
        }
    },
    initSwitch: function () {
        RPG.SWITCH = {};
    },
    setSwitch: function (k, v = true) {
        RPG.SWITCH[k] = v;
    },
    checkSwitch: function (k) {
        if (RPG.SWITCH[k]) {
            return Boolean(RPG.SWITCH[k]);
        } else {
            return false;
        }
    },


// 获得移动方向，返回为一个数组，可以二选一
    getMoveDir: function (ax, ay) {
        let a = ax - player.x - charaLayer.x - STEP / 2;
        let b = ay - player.y - charaLayer.y - STEP / 2;
        let ret1 = [];
        let ret2 = [];
        if (a > STEP / 2) {
            ret1.push(RIGHT);
        } else if (a < -STEP / 2) {
            ret1.push(LEFT);
        }
        if (b > STEP / 2) {
            ret2.push(DOWN);
        } else if (b < -STEP / 2) {
            ret2.push(UP);
        }
        if (Math.abs(a) > Math.abs(b)) {
            return ret1.concat(ret2);
        } else {
            return ret2.concat(ret1);
        }
    },

    /**
     * 点击地图处理
     **/
    dealNormal: function (x, y) {
        // 根据点击位置，判断移动方向
        if (player) {
            console.log('player', player);
            //获取移动方向
            let ret = RPG.getMoveDir(x, y);
            if (ret.length === 0) {
                RPG.openMenu();
            } else {
                player.changeDirAlt(ret);
            }
        }
    },

    hideChar: function (aChar) {
        charaLayer.removeChild(aChar);
        //aChar.die();
    },

    showSaveSlot: function (aSlot) {
        if (aSlot >= 0 && aSlot < RPG.MaxSaveSlot) {
            let result = RPG.saveList[aSlot].name;
            if (RPG.saveList[aSlot].date) {
                for (let i = RPG.saveList[aSlot].name.length; i < 6; i++) {
                    result = result + "　";
                }
                result = result + "(" + RPG.saveList[aSlot].date + ")";
            }
            return result;
        }
    },
    getDateTimeStr: function () {
        let myDate = new Date();
        let hh = myDate.getHours();
        let mm = myDate.getMinutes();
        //myDate.getFullYear()+ "-"
        let result = ""
            + (myDate.getMonth() + 1) + "-"
            + myDate.getDate() + " "
            + (hh < 10 ? "0" : "")
            + hh + ":"
            + (mm < 10 ? "0" : "")
            + mm
        ;
        return result;
    },
    howToUse: function () {
        Talk.startTalk(talkList.gameExplainTalk);
    },
    drawCover: function () {
        // 封面图
        RPG.setState(RPG.IN_COVER);
        let sLayer = effectLayer;
        sLayer.removeAllChild();

        let title = UI.text('废土战记', 0, 50, '35');
        title.x = (WIDTH - title.getWidth()) >> 1;
        sLayer.addChild(title);

        // 新的开始
        let button01 = UI.gameTitleButton(120, 30, (WIDTH - 120) >> 1, HEIGHT - 200, "新游戏", function () {
            // 按钮被透过窗口点击
            if (RPG.checkState(RPG.IN_COVER)) {
                RPG.newGame();
            }
        });
        sLayer.addChild(button01);

        // 继续
        let button02 = UI.gameTitleButton(120, 30, (WIDTH - 120) >> 1, HEIGHT - 160, "载入进度", function () {
            if (RPG.checkState(RPG.IN_COVER)) {
                RPG.openLoadMenu();
            }
        });
        button02.setState(LButton.STATE_DISABLE);
        sLayer.addChild(button02);

        // 关于
        let button03 = UI.gameTitleButton(120, 30, (WIDTH - 120) >> 1, HEIGHT - 120, "关于", function () {
            if (RPG.checkState(RPG.IN_COVER)) {
                RPG.howToUse();
            }
        });
        sLayer.addChild(button03);

        if (window.localStorage) {
            let saveList = JSON.parse(window.localStorage.getItem("WLSaveList"));
            if (saveList) {
                button02.setState(LButton.STATE_ENABLE);
                RPG.copySaveList(saveList);
            } else {
                button02.setState(LButton.STATE_DISABLE);
                RPG.newSaveList();
            }
        }
        // let bitmapdata = new LBitmapData(assets["start_png"]);
        // let bitmap = new LBitmap(bitmapdata);
        // bitmap.scaleX = WIDTH/ bitmap.width;
        // bitmap.scaleY = HEIGHT/ bitmap.height;
        // bitmap.x = 0;
        // bitmap.y = 0;
        // bitmap.alpha = 1;
        // sLayer.addChild(bitmap);
    },

    // 新游戏初始化信息
    newGame: function () {
        //初始化玩家队伍
        mainTeam = RPG.beget(PlayerTeam);
        //向玩家队伍增加人物（人物索引，人物等级)
        mainTeam.addHero(0, 50, '路漫漫');
        mainTeam.addHero(1, 50, '废土04');
        //添置物品
        mainTeam.addItem(11, 20);
        mainTeam.addItem(12, 20);

        RPG.initSwitch();
        //初始化敌人
        RPG.initEnemyTeam();
        //载入场景
        jumpStage(script.stage01, 8, 20, 3);

        //进入地图控制状态
        RPG.setState(RPG.MAP_CONTROL);
    },

// 初始化敌人战斗队的数据
    initEnemyTeam: function () {
        let team1;
        // A队=0
        team1 = RPG.beget(PlayerTeam);
        team1.clear();
        team1.addEnemy(0, 10);
        team1.addEnemy(1, 10);
        team1.addItem(1, 2);
        RPG.enemyTeam.push(team1);

        // B队=1
        team1 = RPG.beget(PlayerTeam);
        team1.clear();
        team1.addEnemy(0, 20);
        team1.addEnemy(1, 20);
        team1.addItem(1, 2);
        RPG.enemyTeam.push(team1);

        // C队=2
        team1 = RPG.beget(PlayerTeam);
        team1.clear();
        team1.addEnemy(0, 50);
        team1.addItem(1, 2);
        RPG.enemyTeam.push(team1);

        // D队=3
        team1 = RPG.beget(PlayerTeam);
        team1.clear();
        team1.addEnemy(1, 50);
        RPG.enemyTeam.push(team1);

        // E队=4
        team1 = RPG.beget(PlayerTeam);
        team1.clear();
        team1.addEnemy(0, 20);
        team1.addEnemy(1, 20);
        team1.addEnemy(0, 20);
        team1.addEnemy(1, 20);
        team1.addItem(1, 2);
        RPG.enemyTeam.push(team1);
    },

    newSaveList: function () {
        // 存档记录为空
        RPG.saveList = [];
        for (let i = 0; i < RPG.MaxSaveSlot; i++) {
            RPG.saveList.push({name: "空记录", date: null});
        }
    },
    copySaveList: function (saveList) {
        // 读取存档记录
        RPG.saveList = saveList.slice(0);
    },

    saveGame: function (slot) {
        if (slot >= 0 && slot < RPG.MaxSaveSlot) {
            RPG.saveList[slot].name = stage.name;
            RPG.saveList[slot].date = RPG.getDateTimeStr();
            if (window.localStorage) {
                window.localStorage.setItem("WLSaveList", JSON.stringify(RPG.saveList));
                let saveData = {
                    px: player.px,
                    py: player.py,
                    itemList: mainTeam.itemList,
                    heroList: mainTeam.heroList,
                    stageId: stage.id,
                    swt: RPG.SWITCH
                };
                // window.localStorage.setItem("WLSaveSlot" + slot, RPG.Serialize(saveData));
                window.localStorage.setItem("WLSaveSlot" + slot, JSON.stringify(saveData));

            }
        }
    },

    loadGame: function (slot) {
        if (slot >= 0 && slot < RPG.MaxSaveSlot) {
            if (window.localStorage) {
                let saveDataStr = window.localStorage.getItem("WLSaveSlot" + slot);
                if (saveDataStr) {
                    // let tempData = eval("(" + saveData + ")");
                    let saveData = JSON.parse(saveDataStr);
                    console.log(saveData);

                    mainTeam = RPG.beget(PlayerTeam);
                    for (let i = 0; i < saveData.itemList.length; i++) {
                        mainTeam.addItem(saveData.itemList[i].index, saveData.itemList[i].num);
                    }
                    for (let i = 0; i < saveData.heroList.length; i++) {
                        mainTeam.addHero(saveData.heroList[i].index, saveData.heroList[i].Level);
                        RPG.extend(mainTeam.heroList[i], saveData.heroList[i]);
                    }
                    RPG.initSwitch();
                    RPG.extend(RPG.SWITCH, saveData.swt);
                    jumpStage(script[saveData.stageId], Number(saveData.px), Number(saveData.py));
                    RPG.initEnemyTeam();
                    // 进入地图控制状态
                    RPG.setState(RPG.MAP_CONTROL);

                    /*mainTeam = RPG.beget(PlayerTeam);
                    for (let i = 0; i < tempData.items.length; i++) {
                        mainTeam.addItem(tempData.items[i].index, tempData.items[i].num);
                    }
                    for (let i = 0; i < tempData.heros.length; i++) {
                        mainTeam.addHero(tempData.heros[i].index, tempData.heros[i].Level);
                        RPG.extend(mainTeam.heroList[i], tempData.heros[i]);
                    }
                    RPG.initSwitch();
                    RPG.extend(RPG.SWITCH, tempData.swt);
                    jumpStage(script[tempData.gate], Number(tempData.x), Number(tempData.y));
                    RPG.initEnemyTeam();
                    // 进入地图控制状态
                    RPG.setState(RPG.MAP_CONTROL);*/

                }
            }
        }
    },

    /**
     * 普通白底按钮
     **/
    newButton: function (aw, ah, ax, ay, aText, callback) {
        // 这个是普通的按钮
        let bitmapDataUp = new LBitmapData(assets["button1"]);
        let bitmapUp = new LBitmap(bitmapDataUp);
        bitmapUp.scaleX = aw / 30;
        bitmapUp.scaleY = ah / 30;
        let bitmapDataDown = new LBitmapData(assets["button1_down"]);
        let bitmapDown = new LBitmap(bitmapDataDown);
        bitmapDown.scaleX = aw / 30;
        bitmapDown.scaleY = ah / 30;
        // 保持进度的按钮
        let button02 = new LButton(bitmapUp, null, bitmapDown);
        button02.x = ax;
        button02.y = ay;
        let text = new LTextField();
        text.size = "15";
        text.color = "#FFF";
        text.text = aText;
        text.textAlign = "center";
        text.textBaseline = "middle";
        //text.x = bitmapUp.scaleX* bitmapUp.width/ 2;
        //text.y = bitmapUp.scaleY* bitmapUp.height/ 2;
        text.x = button02.getWidth() / 2;
        text.y = button02.getHeight() / 2;
        button02.addChild(text);
        button02.addEventListener(LMouseEvent.MOUSE_DOWN, function () {
            RPG.currentButton = button02;
        });
        button02.addEventListener(LMouseEvent.MOUSE_UP, function () {
            if (RPG.currentButton === button02) {
                if (callback) callback();
            }
        });
        return button02;
    },
};







