

(function() {
  
	// Размеры всей книги
	var BOOK_WIDTH = 830;
	var BOOK_HEIGHT = 260;
	
	// Размеры одной страницы
	var PAGE_WIDTH = 400;
	var PAGE_HEIGHT = 250;
	
	// Растояние по вертикали между краями страницы и книги
	var PAGE_Y = ( BOOK_HEIGHT - PAGE_HEIGHT ) / 2;
	
	// Размер элемента canvas равен размеру книги + отступ
	var CANVAS_PADDING = 60;
	
	var page = 0;
	
	var canvas = document.getElementById( "pageflip-canvas" );
	var context = canvas.getContext( "2d" );
	
	var mouse = { x: 0, y: 0 };
	
	var flips = [];
	
	var book = document.getElementById( "book" );
	
	// Списко всех элементов страницы в DOM
	var pages = book.getElementsByTagName( "section" );
	
	// Организуем глубину расположения страниц и создаем определение переворота
	for( var i = 0, len = pages.length; i < len; i++ ) {
		pages[i].style.zIndex = len - i;
		
		flips.push( {
			// Текущий прогресс переворота(слева -1 направо +1)
			progress: 1,
			// Целевое положение до которого осуществляется переворот
			target: 1,
			// Элемент структуры DOM соответствующий перевороту
			page: pages[i], 
			// Сотояние процесса перетаскивания
			dragging: false
		} );
	}
	
	// Изменяем размер элемента canvas в соответствии с книгой
	canvas.width = BOOK_WIDTH + ( CANVAS_PADDING * 2 );
	canvas.height = BOOK_HEIGHT + ( CANVAS_PADDING * 2 );
	
	// Смещение элемента canvas для организации отступа
	canvas.style.top = -CANVAS_PADDING + "px";
	canvas.style.left = -CANVAS_PADDING + "px";
	
	// Выводим графику 60 раз в секунду
	setInterval( render, 1000 / 60 );
	
	document.addEventListener( "mousemove", mouseMoveHandler, false );
	document.addEventListener( "mousedown", mouseDownHandler, false );
	document.addEventListener( "mouseup", mouseUpHandler, false );
	
	function mouseMoveHandler( event ) {
		// Смещение курсора мыши в системе координат книги
		mouse.x = event.clientX - book.offsetLeft - ( BOOK_WIDTH / 2 );
		mouse.y = event.clientY - book.offsetTop;
	}
	
	function mouseDownHandler( event ) {
		if (Math.abs(mouse.x) < PAGE_WIDTH) {
			if (mouse.x < 0 && page - 1 >= 0) {
				flips[page - 1].dragging = true;
			}
			else if (mouse.x > 0 && page + 1 < flips.length) {
				flips[page].dragging = true;
			}
		}
		
		// Предотвращаем выделение текста при перетаскивании курсора мыши
		event.preventDefault();
	}
	
	function mouseUpHandler( event ) {
		for( var i = 0; i < flips.length; i++ ) {
			// Если данный объект flip находится в состоянии перетаскивания, анимируем его движение
			if( flips[i].dragging ) {
				// вычисляем страницу, которая должна быть следующей в соответствии с направление переворотаFigure out which page we should go to next depending on the flip direction
				if( mouse.x < 0 ) {
					flips[i].target = -1;
					page = Math.min( page + 1, flips.length );
				}
				else {
					flips[i].target = 1;
					page = Math.max( page - 1, 0 );
				}
			}
			
			flips[i].dragging = false;
		}
	}
	
	function render() {
		
		context.clearRect( 0, 0, canvas.width, canvas.height );
		
		for (var i = 0; i < flips.length; i++) {
			var flip = flips[i];
			
			if( flip.dragging ) {
				flip.target = Math.max( Math.min( mouse.x / PAGE_WIDTH, 1 ), -1 );
			}
			
			flip.progress += ( flip.target - flip.progress ) * 0.2;
			
			// Если объект flip находится в состоянии перетаскивания  или где-то посредине книги - выводим его
			if( flip.dragging || Math.abs( flip.progress ) < 0.997 ) {
				drawFlip( flip );
			}
			
		}
		
	}
	
	function drawFlip( flip ) {
		// Изгиб страницы максимальный в середине книги
		var strength = 1 - Math.abs( flip.progress );
		
		// Ширина согнутой страницы
		var foldWidth = ( PAGE_WIDTH * 0.5 ) * ( 1 - flip.progress );
		
		// положение X согнутой страницы
		var foldX = PAGE_WIDTH * flip.progress + foldWidth;
		
		// Глубиина перспективы изображения переворота
		var verticalOutdent = 20 * strength;
		
		// Максимальная ширина теней слева и справа
		var paperShadowWidth = ( PAGE_WIDTH * 0.5 ) * Math.max( Math.min( 1 - flip.progress, 0.5 ), 0 );
		var rightShadowWidth = ( PAGE_WIDTH * 0.5 ) * Math.max( Math.min( strength, 0.5 ), 0 );
		var leftShadowWidth = ( PAGE_WIDTH * 0.5 ) * Math.max( Math.min( strength, 0.5 ), 0 );
		
		
		// Изменяем ширину элемента страницы в соответствии с положением Х сгиба
		flip.page.style.width = Math.max(foldX, 0) + "px";
		
		context.save();
		context.translate( CANVAS_PADDING + ( BOOK_WIDTH / 2 ), PAGE_Y + CANVAS_PADDING );
		
		
		// Выводим тени слева и справа
		context.strokeStyle = 'rgba(0,0,0,'+(0.05 * strength)+')';
		context.lineWidth = 30 * strength;
		context.beginPath();
		context.moveTo(foldX - foldWidth, -verticalOutdent * 0.5);
		context.lineTo(foldX - foldWidth, PAGE_HEIGHT + (verticalOutdent * 0.5));
		context.stroke();
		
		
		// Правая падающая тень
		var rightShadowGradient = context.createLinearGradient(foldX, 0, foldX + rightShadowWidth, 0);
		rightShadowGradient.addColorStop(0, 'rgba(0,0,0,'+(strength*0.2)+')');
		rightShadowGradient.addColorStop(0.8, 'rgba(0,0,0,0.0)');
		
		context.fillStyle = rightShadowGradient;
		context.beginPath();
		context.moveTo(foldX, 0);
		context.lineTo(foldX + rightShadowWidth, 0);
		context.lineTo(foldX + rightShadowWidth, PAGE_HEIGHT);
		context.lineTo(foldX, PAGE_HEIGHT);
		context.fill();
		
		
		// Левая падающая тень
		var leftShadowGradient = context.createLinearGradient(foldX - foldWidth - leftShadowWidth, 0, foldX - foldWidth, 0);
		leftShadowGradient.addColorStop(0, 'rgba(0,0,0,0.0)');
		leftShadowGradient.addColorStop(1, 'rgba(0,0,0,'+(strength*0.15)+')');
		
		context.fillStyle = leftShadowGradient;
		context.beginPath();
		context.moveTo(foldX - foldWidth - leftShadowWidth, 0);
		context.lineTo(foldX - foldWidth, 0);
		context.lineTo(foldX - foldWidth, PAGE_HEIGHT);
		context.lineTo(foldX - foldWidth - leftShadowWidth, PAGE_HEIGHT);
		context.fill();
		
		
		// Градиент для страницы
		var foldGradient = context.createLinearGradient(foldX - paperShadowWidth, 0, foldX, 0);
		foldGradient.addColorStop(0.35, '#fafafa');
		foldGradient.addColorStop(0.73, '#eeeeee');
		foldGradient.addColorStop(0.9, '#fafafa');
		foldGradient.addColorStop(1.0, '#e2e2e2');
		
		context.fillStyle = foldGradient;
		context.strokeStyle = 'rgba(0,0,0,0.06)';
		context.lineWidth = 0.5;
		
		// выводим согнутую страницу
		context.beginPath();
		context.moveTo(foldX, 0);
		context.lineTo(foldX, PAGE_HEIGHT);
		context.quadraticCurveTo(foldX, PAGE_HEIGHT + (verticalOutdent * 2), foldX - foldWidth, PAGE_HEIGHT + verticalOutdent);
		context.lineTo(foldX - foldWidth, -verticalOutdent);
		context.quadraticCurveTo(foldX, -verticalOutdent * 2, foldX, 0);
		
		context.fill();
		context.stroke();
		
		
		context.restore();
	}
	
})();
