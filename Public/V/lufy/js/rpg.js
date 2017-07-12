// 全局标记参数
var RPG = {};
// based on https://github.com/documentcloud/underscore/blob/bf657be243a075b5e72acc8a83e6f12a564d8f55/underscore.js#L767
RPG.extend = function ( obj, source ) {
	// ECMAScript5 compatibility based on: http://www.nczonline.net/blog/2012/12/11/are-your-mixins-ecmascript-5-compatible/
	if ( Object.keys ) {
		var keys = Object.keys( source );
		for (var i = 0, il = keys.length; i < il; i++) {
			var prop = keys[i];
			Object.defineProperty( obj, prop, Object.getOwnPropertyDescriptor( source, prop ) );
		}
	} else {
		var safeHasOwnProperty = {}.hasOwnProperty;
		for ( var prop in source ) {
			if ( safeHasOwnProperty.call( source, prop ) ) {
				obj[prop] = source[prop];
			}
		}
	}
	return obj;
};

// beget继承方法
RPG.beget= function(o){
	var F= function(){};
	F.prototype= o;
	var G= new F();
	if (G.init) {
		G.init();
	}
	return G;
};
// RPG基本管理参数，根据不同项目，应当调整

	//方向常量
	RPG.DOWN = 0;
	RPG.LEFT = 1;
	RPG.RIGHT = 2;
	RPG.UP = 3;
	// 地图单位
	RPG.STEP = 32;
	RPG.ctrState= 0;
	/**层变量*/
	//显示进度条所用层
	RPG.loadingLayer;
	//游戏底层
	RPG.backLayer;
	//地图层
	RPG.mapLayer;
	//人物层
	RPG.charaLayer;
	//效果层
	RPG.effectLayer;
	//对话层（及菜单，战斗）
	RPG.talkLayer;
	//子菜单层（多个菜单页）
	RPG.ctrlLayer;
	RPG.descLayer;
	// 状态控制===========================================================
	// 状态变量
	RPG.state;
	// 状态栈
	RPG.stateStack=[];
	// 单值状态值
	RPG.IN_COVER= 0;           // 封面
	RPG.COVER_MENU= 1;         // 封面载入菜单
	RPG.MAP_CONTROL= 2;        // 正常控制
	RPG.MAP_WAITING= 3;        // 等待NPC移动，不可控制
	RPG.IN_MENU= 4;            // 菜单中
	RPG.IN_FIGHTING= 5;        // 在战斗菜单中
	RPG.IN_TALKING= 6;         // 对话状态中
	RPG.IN_CHOOSING= 7;        // 选择状态中
	RPG.IN_HELP= 8;            // 在帮助窗口下
	RPG.IN_OVER= 9;            // 在结束状态下
	RPG.FIGHT_RESULT= 10;      // 检查战斗结果（防止战斗异常重入）
	// 组合状态，100以上
	RPG.UNDER_MAP= 101;        // 地图下，包括地图控制和地图等待
	RPG.UNDER_MENU= 102;       // 菜单下，包括主菜单和载入菜单
	RPG.UNDER_WINDOWS= 103;       // 各种窗口下，包括主菜单、载入菜单、战斗系统
	RPG.stateList={101:[RPG.MAP_CONTROL,RPG.MAP_WAITING], 
					102:[RPG.IN_MENU,RPG.COVER_MENU], 
					103:[RPG.IN_MENU,RPG.COVER_MENU,RPG.IN_FIGHTING]};
 	// 流程控制==============================================
 	// 内置开关量
 	RPG.SWITCH={};
 	// 敌人战斗队数据集合
	RPG.enemyTeam=[];
 	//======================================================================
 	// 按钮管理
 	RPG.currentButton= null;
	// ==========================================================
RPG.setState= function(aState){
	//PG.state= aState;
	RPG.stateStack.length= 0;
	RPG.pushState(aState);
}
RPG.pushState= function(aState){
	RPG.stateStack.push(aState);
	RPG.state= aState;
	console.log("push", RPG.state, RPG.stateStack);
}
RPG.popState= function(){
	RPG.stateStack.pop();
	RPG.state = RPG.stateStack[RPG.stateStack.length- 1];
	console.log("pop", RPG.state, RPG.stateStack);
}
RPG.checkState= function(aState){
	if (aState< 50) {
		if (RPG.state== aState){
			return true;
		} else {
			return false;
		}
	} else {
		var stateSet= RPG.stateList[aState];
		if (stateSet){
			for (var i= 0; i< stateSet.length; i++) {
				if (RPG.state== stateSet[i]){
					return true;
				}
			}
			return false;
		} else {
			return false;
		}

	}
};

RPG.initSwitch = function(){
	RPG.SWITCH = {};
};
RPG.setSwitch= function(k,v=true){
	RPG.SWITCH[k]= v;
};
RPG.checkSwitch= function(k){
	if(RPG.SWITCH[k]) {
		return Boolean(RPG.SWITCH[k]);
	} else {
		return false;
	}
};

RPG.layerInit= function() {
	backLayer = new LSprite();
	addChild(backLayer);
	//地图层
	mapLayer = new LSprite();
	backLayer.addChild(mapLayer);
	//人物层
	charaLayer = new LSprite();
	backLayer.addChild(charaLayer);
	//上地图层
	upLayer = new LSprite();
	backLayer.addChild(upLayer);

    //效果层
	effectLayer = new LSprite();
	backLayer.addChild(effectLayer);
	//菜单层
	talkLayer = new LSprite();
	backLayer.addChild(talkLayer);
};

/**
 * 背景框
 */
RPG.drawWindow= function(layer, x, y, w, h, alpha) {
	let talkWindow = new LSprite();
    talkWindow.graphics.drawRect(5,'#ffe',[0,0,w,h],true,'#009');
    talkWindow.x = x;
    talkWindow.y = y;
	if (alpha) {
        talkWindow.alpha = alpha;
	} else {
        talkWindow.alpha = 0.9;
	}
	layer.addChild(talkWindow);
	return talkWindow;
};

RPG.drawScale= function(aLayer, aColor, ax, ay, aw, ah) {
	let bitmapData = new LBitmapData(imglist[aColor]);
	let bitmap = new LBitmap(bitmapData);
	bitmap.scaleX = aw/ bitmap.width;
	bitmap.scaleY = ah/ bitmap.height;
	bitmap.x = ax;
	bitmap.y = ay;
	bitmap.alpha = 1;
	aLayer.addChild(bitmap);
};

RPG.drawFocus= function(aLayer, ax, ay, aw, ah) {
	let bitmapData = new LBitmapData(imglist["focus"]);
	let bitmap = new LBitmap(bitmapData);
	bitmap.scaleX = aw/ bitmap.width;
	bitmap.scaleY = ah/ bitmap.height;
	bitmap.x = ax;
	bitmap.y = ay;
	bitmap.alpha = 0.5;
	aLayer.addChild(bitmap);
	return bitmap;
};

RPG.moveNpc= function(npc, stepArr){
	npc.moveMode= 2;
	npc.stepArray= stepArr;
	if (npc.stepArray.length> 0){
		npc.changeDir(npc.stepArray[0]);
	}
};
RPG.hideChar= function(aChar){
	charaLayer.removeChild(aChar);
	//aChar.die();
};
RPG.waitCharPos= function (npc, x, y, callback){
    if ((npc.x/STEP)<<0 !== x || (npc.y/STEP)<<0 !== y) {
        setTimeout(function(){RPG.waitCharPos(npc, x, y, callback);}, 500);
	} else {
		if (callback) callback();
	}
};
RPG.Serialize= function (obj){
    switch(obj.constructor){     
        case Object:     
            var str = "{";     
            for(var o in obj){
            	var tmp= RPG.Serialize(obj[o]);
            	if (tmp) {
                	str += o + ":" + tmp +",";
                }
            }     
            if(str.substr(str.length-1) == ",")     
                str = str.substr(0,str.length -1);     
             return str + "}";     
             break;     
         case Array:                 
             var str = "[";     
             for(var o in obj){     
            	var tmp= RPG.Serialize(obj[o]);
            	if (tmp) {
                 	str += tmp +",";
                 }
             }     
             if(str.substr(str.length-1) == ",")     
                 str = str.substr(0,str.length -1);     
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
 };
RPG.jumpStage = function(newStage, x, y, face){
    stage = newStage;
	//开始跳转
	initScript(x, y, face);
};
// 获得移动方向，返回为一个数组，可以二选一
RPG.getMoveDir= function(ax, ay) {
    let a = ax - player.x - charaLayer.x- STEP/ 2;
    let b = ay - player.y - charaLayer.y- STEP/ 2;
    let ret1= [];
    let ret2= [];
    if (a > STEP/ 2) {
    	ret1.push(RIGHT);
    } else if (a< - STEP/ 2) {
	    ret1.push(LEFT);
	}
    if (b > STEP/ 2) {
    	ret2.push(DOWN);
    } else if (b< - STEP/ 2) {
	    ret2.push(UP);
	}
	if (Math.abs(a) > Math.abs(b)) {
		return ret1.concat(ret2);
	} else {
		return ret2.concat(ret1);
	}
};

/**
 * 点击地图处理
 **/
RPG.dealNormal= function(x, y){
    // 根据点击位置，判断移动方向
    if (player) {
    	//获取移动方向
    	let ret = RPG.getMoveDir(x, y);
        console.log('ret',ret);
        if (ret.length === 0) {
            RPG.openMenu();
    	} else {
	        player.changeDirAlt(ret);
    	}
	}
};

RPG.imgButton = (text)=>{
    let bitmapDataUp = new LBitmapData(result["ok_button"],0,0,98,48);
    let bitmapUp = new LBitmap(bitmapDataUp);
    let bitmapDataOver = new LBitmapData(result["ok_button"],0,48,98,48);
    let bitmapOver = new LBitmap(bitmapDataOver);
    bitmapUp.scaleX = 0.5;
    bitmapOver.scaleX = 0.5;
    let button = new LButton(bitmapUp,bitmapOver);
    button.x = 50;
    button.y = 150;
    let title = new LTextField();
    title.text = text;
    title.color = "#FF0000";
    title.size = 20;
    title.x = (button.getWidth() - title.getWidth())*0.5;
    title.y = (button.getHeight() - title.getHeight())*0.5;
    button.addChild(title);
    return button;
};
/**
 * diy按钮
 **/
RPG.diyButton = ()=>{
    let title;
    let upState = new LShape("#666",200,50);
    title = new LTextField();
    title.text = "upState";
    title.color = "#FF0000";
    title.size = 20;
    title.x = (upState.getWidth() - title.getWidth())*0.5;
    title.y = (upState.getHeight() - title.getHeight())*0.5;
    upState.addChild(title);
    let overState = new LShape("#999",200,50);
    title = new LTextField();
    title.text = "overState";
    title.color = "#FF0000";
    title.size = 20;
    title.x = (upState.getWidth() - title.getWidth())*0.5;
    title.y = (upState.getHeight() - title.getHeight())*0.5;
    overState.addChild(title);
    let downState = new LShape("#CCC",200,50);
    title = new LTextField();
    title.text = "downState";
    title.color = "#FF0000";
    title.size = 20;
    title.x = (upState.getWidth() - title.getWidth())*0.5;
    title.y = (upState.getHeight() - title.getHeight())*0.5;
    downState.addChild(title);
    let button01 = new LButton(upState,overState,downState);
    button01.x = 50;
    button01.y = 50;
    return button01;
};

/**
 * 普通白底按钮
 **/
RPG.newButton= function(aw, ah, ax, ay, aText, callback) {
	// 这个是普通的按钮
	let bitmapDataUp = new LBitmapData(imglist["button1"]);
	let bitmapUp = new LBitmap(bitmapDataUp);
	bitmapUp.scaleX= aw/ 30;
	bitmapUp.scaleY= ah/ 30;
	let bitmapDataDown = new LBitmapData(imglist["button1_down"]);
	let bitmapDown = new LBitmap(bitmapDataDown);
	bitmapDown.scaleX= aw/ 30;
	bitmapDown.scaleY= ah/ 30;
	// 保持进度的按钮
	let button02 = new LButton(bitmapUp,null,bitmapDown);
	button02.x= ax;
	button02.y= ay;
	let text = new LTextField();
	text.size = "15";
	text.color = "#FFF";
	text.text = aText;
	text.textAlign= "center";
	text.textBaseline= "middle";
	//text.x = bitmapUp.scaleX* bitmapUp.width/ 2;
	//text.y = bitmapUp.scaleY* bitmapUp.height/ 2;
	text.x = button02.getWidth()/ 2;
	text.y = button02.getHeight()/ 2;
	button02.addChild(text);
	button02.addEventListener(LMouseEvent.MOUSE_DOWN, function() {
		RPG.currentButton= button02;
	});
	button02.addEventListener(LMouseEvent.MOUSE_UP, function () {
		if (RPG.currentButton == button02) {
			if (callback) callback();
		}
	});
	return button02;
};

/**
 * option白底按钮
 **/
RPG.newSimpleButton= function(aw, ah, ax, ay, aText, aFunc) {
	let bitmapDataUp = new LBitmapData(imglist["focus"]);
	let bitmapUp = new LBitmap(bitmapDataUp);
	bitmapUp.scaleX= aw/ bitmapUp.width;
	bitmapUp.scaleY= ah/ bitmapUp.height;
	bitmapUp.alpha= 0.2;
	let bitmapDataDown = new LBitmapData(imglist["focus"]);
	let bitmapDown = new LBitmap(bitmapDataDown);
	bitmapDown.scaleX= aw/ bitmapDown.width;
	bitmapDown.scaleY= ah/ bitmapDown.height;
	bitmapDown.alpha= 0.5;
	// 保持进度的按钮
	let button02 = new LButton(bitmapUp,bitmapDown,bitmapDown);
	button02.x= ax;
	button02.y= ay;
	let text = new LTextField();
	text.size = "15";
	text.color = "#FFF";
	text.text = aText;
	text.textAlign= "center";
	text.textBaseline= "middle";
	//text.x = bitmapUp.scaleX* bitmapUp.width/ 2;
	//text.y = bitmapUp.scaleY* bitmapUp.height/ 2;
	text.x = button02.getWidth()/ 2;
	text.y = button02.getHeight()/ 2;
	button02.addChild(text);
	button02.addEventListener(LMouseEvent.MOUSE_DOWN, function() {
		RPG.currentButton= button02;
	});
	button02.addEventListener(LMouseEvent.MOUSE_UP, function () {
		if (RPG.currentButton== button02) {
			if (aFunc) aFunc();
		}
	});
	return button02;
};

/**
 * ico图标按钮
 **/
RPG.newIconButton= function(aPicUp, aPicDown, aPicDis, ax, ay, aRate, aText, aFunc) {
	// 这个是图标按钮
	let bitmapDataUp = new LBitmapData(imglist["iconset"], aPicUp.x*RPG.iconStep, aPicUp.y*RPG.iconStep, RPG.iconStep, RPG.iconStep);
	let bitmapUp = new LBitmap(bitmapDataUp);
	bitmapUp.scaleX= aRate;
	bitmapUp.scaleY= aRate;
	let bitmapDataDown = new LBitmapData(imglist["iconset"], aPicDown.x*RPG.iconStep, aPicDown.y*RPG.iconStep, RPG.iconStep, RPG.iconStep);
	let bitmapDown = new LBitmap(bitmapDataDown);
	let bitmapDataDis = new LBitmapData(imglist["iconset"], aPicDis.x*RPG.iconStep, aPicDis.y*RPG.iconStep, RPG.iconStep, RPG.iconStep);
	let bitmapDis = new LBitmap(bitmapDataDis);
	bitmapDis.scaleX= aRate;
	bitmapDis.scaleY= aRate;
	bitmapDown.scaleX= aRate;
	bitmapDown.scaleY= aRate;
	// 保持进度的按钮
	let btn = new LButton(bitmapUp, null, bitmapDown, bitmapDis);
	btn.x= ax;
	btn.y= ay;
	let text = new LTextField();
	text.size = "15";
	text.color = "#FFF";
	text.text = aText;
	text.textAlign= "center";
	text.textBaseline= "middle";
	text.x = btn.getWidth()/ 2;
	text.y = btn.getHeight()+ 10;
	btn.addChild(text);
	btn.addEventListener(LMouseEvent.MOUSE_DOWN, function() {
		RPG.currentButton= btn;
	});
	btn.addEventListener(LMouseEvent.MOUSE_UP, function () {
		if (RPG.currentButton== btn) {
			if (aFunc) aFunc();
		}
	});
	return btn;
};

RPG.getRandomNum= function(Min,Max){
	let Range = Max - Min;
	let Rand = Math.random();
	return(Min + Math.floor(Rand * Range));
};

// 重排动态角色，以便正确遮盖
RPG.resetChildIndex= function(aLayer){
	// 排序以脚为准
	let y1, y2, h1, h2;
	for (let i=0; i< aLayer.childList.length; i++){
		h1= charaLayer.childList[i].ph;
		if (!h1) {
			h1= charaLayer.childList[i].height+ 1;
		}
		y1= charaLayer.childList[i].y+ h1;
		//c1= charaLayer.getChildIndex(charaLayer.childList[i]);
		for (let j= i+ 1; j< aLayer.childList.length; j++){
			h2= charaLayer.childList[j].ph;
			if (!h2) {
				h2= charaLayer.childList[j].height+ STEP;
			}
			y2= charaLayer.childList[j].y+ h2;
			//c2= charaLayer.getChildIndex(charaLayer.childList[j]);
			//if ((c1> c2 && y1< y2) || (c1< c2 && y1> y2)) {
			if (y1> y2) {
				charaLayer.setChildIndex(charaLayer.childList[j], i);
				//c1= c2;
				y1= y2;
			}
		}
	}
};
