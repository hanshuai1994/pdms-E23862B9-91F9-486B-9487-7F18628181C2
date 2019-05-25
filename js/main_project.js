var model;//模型本身

//鼠标事件变量
let mousedown = false;
let mousemove = false;
let selected_mesh;

var last_emissive_array = [];
var getData = location.search;
var projectname = new Object();
if(getData.indexOf("?") != -1){
	projectname = getData.substring(getData.indexOf("=")+1,getData.length);
}
console.log(projectname);
var list=[];
window.onload = function(event) {
	init(name,list);
	showarea.style.display = "block";
	var lastDate = new Date();//获取系统当前时间
	console.log("页面加载完成：" +  lastDate.toLocaleString());
}

var back = document.getElementById("back");
back.onclick = function() {
	window.location.href= "index.html";
}

function init(name,list) {
	console.log('进入threejs场景init')
	showarea.style.display = "block";
	var biaoti = document.getElementById("biaoti");
	//console.log(name);
	biaoti.innerHTML = name;
	var container = document.getElementById("container");

	var left0 = window.innerHeight * 0.2;
	var width0 = window.innerWidth * 0.8;
	var top0 = 44;
	var height0 = window.innerHeight - 44;

	camera = new THREE.PerspectiveCamera(45, width0 / height0, 1, 200000000);
	camera.position.set(100, 200, 300);

	controls = new THREE.OrbitControls(camera, container);
	controls.target.set(0, 100, 0);
	controls.update();

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xa0a0a0);
	//scene.fog = new THREE.Fog(0xa0a0a0, 200, 2000);

	renderer = new THREE.WebGLRenderer({
		antialias: true
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(width0, height0);
	renderer.shadowMap.enabled = true;
	container.appendChild(renderer.domElement);
	renderer.domElement.addEventListener('mousedown', mousedown, false);
	renderer.domElement.addEventListener('mousemove', mousemove, false);
	renderer.domElement.addEventListener('mouseup', mouseup, false);

	light = new THREE.HemisphereLight(0xffffff, 0x444444);
	light.position.set(0, 200, 0);
	scene.add(light);

	light = new THREE.DirectionalLight(0xffffff);
	light.position.set(0, 200, 100);
	light.castShadow = true;
	light.shadow.camera.top = 180;
	light.shadow.camera.bottom = -100;
	light.shadow.camera.left = -120;
	light.shadow.camera.right = 120;
	scene.add(light);

	// Water

	// var waterGeometry = new THREE.PlaneBufferGeometry( 10000, 10000 );
	var waterGeometry = new THREE.CircleBufferGeometry( 100000, 32 );

	water = new THREE.Water(
		waterGeometry,
		{
			textureWidth: 512,
			textureHeight: 512,
			waterNormals: new THREE.TextureLoader().load( './img/waternormals.jpg', function ( texture ) {

				texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

			} ),
			alpha: 0.9,
			size: 0.1,
			sunDirection: light.position.clone().normalize(),
			sunColor: 0xffffff,
			waterColor: 0x001e0f,
			distortionScale: 3.7,
			fog: scene.fog !== undefined
		}
	);

	water.rotation.x = - Math.PI / 2;
	// console.log('water', water);
	scene.add( water );
	
	// Skybox

	var sky = new THREE.Sky();

	var uniforms = sky.material.uniforms;

	uniforms[ 'turbidity' ].value = 10;
	uniforms[ 'rayleigh' ].value = 2;
	uniforms[ 'luminance' ].value = 1;
	uniforms[ 'mieCoefficient' ].value = 0.005;
	uniforms[ 'mieDirectionalG' ].value = 0.8;

	var parameters = {
		distance: 400,
		inclination: 0.44,
		azimuth: 0.205
	};

	var cubeCamera = new THREE.CubeCamera( 0.1, 1, 512 );
	cubeCamera.renderTarget.texture.generateMipmaps = true;
	cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;

	scene.background = cubeCamera.renderTarget;

	function updateSun() {

		var theta = Math.PI * ( parameters.inclination - 0.5 );
		var phi = 2 * Math.PI * ( parameters.azimuth - 0.5 );

		light.position.x = parameters.distance * Math.cos( phi );
		light.position.y = parameters.distance * Math.sin( phi ) * Math.sin( theta );
		light.position.z = parameters.distance * Math.sin( phi ) * Math.cos( theta );

		sky.material.uniforms[ 'sunPosition' ].value = light.position.copy( light.position );
		water.material.uniforms[ 'sunDirection' ].value.copy( light.position ).normalize();

		cubeCamera.update( renderer, sky );

	}

	updateSun();


	// ground
	var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000, 2000), new THREE.MeshPhongMaterial({
		color: 0x999999,
		depthWrite: false
	}));
	mesh.rotation.x = -Math.PI / 2;
	mesh.receiveShadow = true;
	// scene.add(mesh);

	var grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
	grid.material.opacity = 0.2;
	grid.material.transparent = true;
	// scene.add(grid);

	
	window.addEventListener('resize', onWindowResize, false);
	
	animate();
	var data;

	function onWindowResize() {
		var left0 = window.innerHeight * 0.2;
		var width0 = window.innerWidth * 0.8;
		var top0 = 44;
		var height0 = window.innerHeight - 44;
		camera.aspect = width0 / height0;
		camera.updateProjectionMatrix();
		renderer.setSize(width0, height0);
	}
	function mousedown(){
		mousedown = true;
	}
	function mousemove(){
		if(mousedown)
			mousemove = true;
	}
	function mouseup(){
		mousedown = false
		if(mousemove){
			mousemove = false;
		}else{//是一次纯点击事件，触发clik
			console.log('是一次纯点击事件，触发clik')
			let raycaster = new THREE.Raycaster(); //射线
			let mouse = new THREE.Vector2(); //鼠标位置
			let domElement = renderer.domElement;
			mouse.x = (event.offsetX / domElement.clientWidth) * 2 - 1;
			mouse.y = -(event.offsetY / domElement.clientHeight) * 2 + 1;
			raycaster.setFromCamera(mouse, controls.object);

			let intersect = raycaster.intersectObject(model,true);
			if(intersect[0]){
				console.log(intersect[0].object);
				$('#inquery_texture').show()
				selected_mesh.material.emissive.r = 0;
				selected_mesh = intersect[0].object;
				selected_mesh.material.emissive.r = 1;
			}
		}
	}
	
	function animate() {
		requestAnimationFrame(animate);

		water.material.uniforms[ 'time' ].value += 5.0 / 60.0;

		renderer.render(scene, camera);
	}
    buildmodel(list);
}

//提取信息生成目录树
function mulushu(list) {
	var setting = {
		data: {
			simpleData: {
				enable: true,
				idKey: "id",
				pIdKey: "pId",
				rootPId: null
			}
		},
		callback: {
			onClick: nodeClick,
			onExpand: function(event, treeId, treeNode) {
				//console.log(treeNode);
				addSubNode(treeNode);
			}
		}
	};

	var list2 = [];
	var len = list.length;
	for(var i = 0; i < len; i++) {
		if(list[i].pId == 0)
			list2.push(list[i]);
	}

	//console.log(list2);
	var zNodes = list2;

	var zTree = $.fn.zTree.init($("#treebg"), setting, zNodes);
	
	setTimeout(function(){
		var treeObj = $.fn.zTree.getZTreeObj("treebg");
		var nodes = treeObj.getNodes();
		for (var i = 0; i < nodes.length; i++) { //设置节点展开
			treeObj.expandNode(nodes[i], true, false, true);
		}
		addSubNode(nodes[0]);
		console.log('自动展开')
	},3000)
	function nodeClick(event, treeId, treeNode, clickFlag) {
		//console.log(treeNode);
		for(let o of last_emissive_array)
			o.material.emissive.r = 0
		lightallchildren(model.getObjectByName(treeNode.name));
	}

	function addSubNode(treeNode) {
		if(!treeNode.isParent) return;
		var s = treeNode.children;
		if(s != undefined)
			return;
		var data0 = [];
		for(var i = 0; i < list.length; i++) {
			if(list[i].pId == treeNode.id) {
				data0.push(list[i]);
			}
		}
		zTree.addNodes(treeNode, data0);
	}

	function lightallchildren(obj) {
		// console.log(obj);
		if(obj.material){
			obj.material.emissive.r = 1;
			obj.material.emissiveIntensity=1
			last_emissive_array.push(obj)
		}else{
			if(obj.type=='Group'){
				for(let o of obj.children)
					lightallchildren(o)
			}	
		}
	}
}

//载入模型
function buildmodel(list) {
	console.log('进入模型加载')
	var loader = new THREE.FBXLoader();
	var group = new THREE.Group();
	group.name = name;
	$('#loading').css("z-index",100);
	$('#inquery_texture').hide();

	let solving = false; // 正在解析
	loader.load('./model/'+projectname+'.toolkippdms',function(object){
		console.warn('模型加载成功')
		model = object;
		group.add(object)
			//找到模型中心点，重新适配模型位置、相机位置、相机目标和control目标
		var max = {x:-Infinity,y:-Infinity,z:-Infinity}
		var min = {x:Infinity,y:Infinity,z:Infinity}
		
		group.traverse(function(o){
			if(o.geometry){
				if(!o.geometry.boundingBox){
					o.geometry.computeBoundingBox();
				}
				let bbox = o.geometry.boundingBox
				
				if(bbox.min.x<min.x) min.x=bbox.min.x
				if(bbox.min.y<min.y) min.y=bbox.min.y
				if(bbox.min.z<min.z) min.z=bbox.min.z
				if(bbox.max.x>max.x) max.x=bbox.max.x
				if(bbox.max.y>max.y) max.y=bbox.max.y
				if(bbox.max.z>max.z) max.z=bbox.max.z
			}
		})
		console.log(min.x,min.y,min.z,max.x,max.y,max.z);
		
		let k_scale = 500/(max.y-min.y); 
		k_scale/=1000;
		if(projectname=='project3'){
			k_scale*=1000;
			group.rotation.x=-Math.PI/2
			model.position.set( -100,-120, 0)
		}
		console.warn('缩放指数',k_scale)
		group.scale.set(k_scale,k_scale,k_scale)
		
		var xmid = (max.x + min.x) / 2;
		var zmid = (max.x + min.y) / 2;
		group.position.set(- xmid, -min.y, - zmid);

		var C_pos = new THREE.Vector3(1000,1000,1000);
		//console.log(newtarget);
		//console.log(newcpos);
		camera.position.set(C_pos.x, C_pos.y, C_pos.z);
		// console.warn('模型和相机分别移动到',group.position,camera.position)
		camera.lookAt(0,0,0);
		// controls.target.set(newtarget.x, newtarget.y, newtarget.z);
		// controls.update();
		
		merge_obj_children(group)
		function merge_obj_children(obj){    //merge外部导入模型的同材质到一个数组
			console.log('进入合并函数')
			
			let delete_array = []
			obj.traverse(function(o){
				// console.log(o)
				if(o.type =="Group"&&o.children.length==0||['Mesh','Line'].indexOf(o.type)>-1&&(!o.geometry.attributes.position||o.geometry.attributes.position.count==0 )){
					
					// console.log('添加到待删除数组',o)
					delete_array.push(o)
				}
			})
			for(let o of delete_array){
				// console.log('移除空的group',o)
				o.parent.remove(o)
			}
			
			let parent_array = [];
			obj.traverse(function(o){
				// console.log(o)
				if(o.type =="Group"&&o.children.length>1&&is_no_children_group(o)&&is_children_same_kind(o)){//符合要求,merge其中的children mesh
					// console.warn('找到一个符合要求的group,加入到待merge数组里');
					parent_array.push(o)
				}
			})
			// console.log('parent_array',parent_array)
			
			for(let o of parent_array){
				// console.log('运行函数',o)
				let geometry_array = [];
				for(let o1 of o.children){
					if(o1.geometry)
						geometry_array.push(o1.geometry)
				}
				// console.log(geometry_array)
				//开始进行合并
				// console.warn('合并成功了一次0')
				let merged_geometry = THREE.BufferGeometryUtils.mergeBufferGeometries( geometry_array );
				// console.warn('合并成功了一次1',o)
				let merged_mesh = new THREE.Mesh(merged_geometry,o.children[0].material)
				// console.warn('合并成功了一次2')
				o.children = []
				o.add(merged_mesh)
				// console.warn('合并成功了一次')
			}
			
			//是否是空的group
			function is_no_children_group(o){
				for(var c of o.children){
					if(c.type =='Group'){
						return false
					}
				}
				return true;
			}
			
			//children是不是一个种类
			function is_children_same_kind(group){
				let kind = group.children[0].type;
				for(let o of group.children){
					if(o.type!=kind)
						return false
				}
				return true
			}
			
			
			console.warn('merge成功')
			// return group;
		}
		console.warn('开始目录树载入')
		var json_array = []
		read_ztree(group.children[0],json_array,0);
		console.log('目录树',json_array)
		mulushu(json_array);
		$('#loading').css("z-index",0);
	},function ( xhr ) {
		const rate = xhr.loaded / xhr.total;
		if (rate > 0.9) {
			if (!solving) { // 若未进入处理状态
				$('#loading>.text').text('处理中...');
				$('#loading>img').attr('src', './img/solving.gif')
				$('#loading>.progress.load').hide();

				solving = true; // 进入处理状态
			}
		} else {
			const range = `${parseInt(( rate * 100))}%`;
			$('#loading>.progress.load>.progress-bar').css('width', range).text(range);
		}

		// $('#loadingText').text(parseInt(  * 100 )+'%')
		// console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
		// if(xhr.loaded / xhr.total * 100>90){
		// 	$('#loadingText').text('下载成功，正在解析')
		// }

	})
	group.position.set(0, 0, 0);
	scene.add(group);
}
function read_ztree(object,array,pid){
	// console.log(object)
	let new_o = {pId:pid,name:object.name};
	if(pid!=0){
		new_o.id = pid.toString()+(object.parent.children.indexOf(object)+1).toString()
		new_o.id = parseInt(new_o.id)
	}else{
		new_o.id = 1;
		new_o.name =='root_name'
	}
	array.push(new_o)
	if(object.children.length>0){
		new_o.isParent = true
		for(let o of object.children)
			read_ztree(o,array,new_o.id)
	}else{
		new_o.isParent = false
		return;
	}	
}
function getData(name){
	list=[];
	var startDate = new Date();//获取系统当前时间
	console.log("开始取数据的时间：" +  startDate.toLocaleString());
	$.ajax({
		type: 'post',
		async: false,
		dataType: 'json',
		url: 'selectxml.action',
		data: {projectname:name},
		success: function (data) {
			data0 = eval(data);
			var endDate = new Date();//获取系统当前时间
			console.log("获取到数据的时间：" +  endDate.toLocaleString());
			
			for(var i = 0; i < data0.length; i++) {
				var obj = {};
				obj.id = parseInt(data0[i].id);
				obj.pId = parseInt(data0[i].pid);
				obj.type = data0[i].type;
				obj.name = data0[i].name;
				if(data0[i].model != "null") {
					obj.model = JSON.parse(data0[i].model);
				} else {
					obj.model = "null";
				} 
				if(data0[i].isparent == "true") {
					obj.isParent = true;
				} else {
					obj.isParent = false;
				}
				list.push(obj);
			}
		}
	});
}

console.log($('#inquery_texture'))
$('#inquery_texture img').click(function(){
	$('#inquery_texture').hide()
	console.log($(this)[0].src)
	var texture = new THREE.TextureLoader().load($(this)[0].src,function(map){
		
		let g = selected_mesh.geometry;
		if(!g.faceVertexUvs)
			g= new THREE.Geometry().fromBufferGeometry(selected_mesh.geometry)
		
		console.log(g)
		g.computeBoundingBox();
		var box = g.boundingBox;
		var detaX = box.max.x - box.min.x;
		var detaY = box.max.y - box.min.y;
		var detaZ = box.max.z - box.min.z;
		let shortest;
		if(detaZ<detaX&&detaZ<detaY)
			shortest = 'z'
		if(detaY<detaX&&detaY<detaZ)
			shortest = 'y'
		if(detaX<detaZ&&detaX<detaY)
			shortest = 'x'
		
		var faceLength = g.faces.length; //面数
		var v = g.vertices; //顶点数组
		//核心部分，修正uv坐标
		g.faceVertexUvs = [[]]
		for (var i = 0; i <= faceLength - 1; i++) { //遍历每个面
			for (var z = 0; z < 3; z++) { //三角形
				var a = "";
				if (z == 0) a = "a";
				if (z == 1) a = "b";
				if (z == 2) a = "c";
				
				g.faceVertexUvs[0].push([{x:null,y:null},{x:null,y:null},{x:null,y:null}])
				switch(shortest){
					case 'x':
						g.faceVertexUvs[0][i][z].x = (v[g.faces[i][a]].y - box.min.y) / (detaY);
						g.faceVertexUvs[0][i][z].y = 1 - ((v[g.faces[i][a]].z - box.min.z) / (detaZ));
						break;
					case 'y':
						g.faceVertexUvs[0][i][z].x = (v[g.faces[i][a]].x - box.min.x) / (detaX);
						g.faceVertexUvs[0][i][z].y = 1 - ((v[g.faces[i][a]].z - box.min.z) / (detaZ));
						break;
					default :
						console.log()
						g.faceVertexUvs[0][i][z].x = (v[g.faces[i][a]].x - box.min.x) / (detaX);
						g.faceVertexUvs[0][i][z].y = 1 - ((v[g.faces[i][a]].y - box.min.y) / (detaY));
						
				}
			}
		}
		g.uvsNeedUpdate = true;
		selected_mesh.geometry = g;
		selected_mesh.geometry.needsUpdate = true;
		console.log(map)
		selected_mesh.material.color = new THREE.Color(0xffffff)
		selected_mesh.material.map = map;
		selected_mesh.material.needsUpdate = true;
		
	})
})
$('.closeX').click(function(){
	$('#inquery_texture').hide()
})