var graham = require('./../../../libs/math/graham.js');
var debug = require('./../../../libs/logger/cLogger.js');

exports.cRectangleContours = cRectangleContours;

function cRectangleContours() {
	// debug.clear();
}

cRectangleContours.prototype.detect = function(stripes){
	/**
	 * Разделяет множество точек на внешние (outer) и внутренние (inner) границы (наборы точек границ)
	 *
	 * stripes: ленты фундамента 2D
	 */

	var contours = {
		outer: [],
		inner: []
	};




	/** Определим точки внутренних конутуров **/
	// Получим все возможные прямоугольные контуры
	var allContours = this.getContours(stripes, {inside: true});

//	// Методом вычитания контуров (из всех вычитаем контуры лент фундамента), получим пустоты внутри
//	var innerContours = this.diffRectangles(allContours, stripes);


	contours.inner = allContours.inner;
	contours.outer = allContours.outer;

//	// debug.log(allContours.outer);

	return contours;
}

cRectangleContours.prototype.diffRectangles = function(contours1, contours2){
	/**
	 * Находит контуры, которые включены (находятся внутри) другого контура
	 *
	 * Алгоритм идет сравнивает все контура со всеми и создает новый набор не взаимовключенных контуров
	 **/

	var nonOverlapped = [];

	var isOverlapping = false;

	for(var i = 0; i < contours1.length; i++){
		isOverlapping = false;

		for(var j = 0; j < contours2.length; j++){

			if(this.checkOverlapping(contours1[i], contours2[j]) === true){
				// Если контур включен в другой, делаем отметку и выскакиваем из внутреннего цикла

				isOverlapping =  true;
				break;
			}

		}


		if(isOverlapping === false){
			// i-й контур прошол успешную проверку, он не ключон ни в один из других

			nonOverlapped.push(contours1[i]);
		}
	}

	return nonOverlapped;
}

cRectangleContours.prototype.checkOverlapping = function(c1, c2){
	/**
	 * Сравнение будет идти по крайним: начиная с левой нижней по часовой стрелке
	 * c1 - конутр, который может быть вписаен к контур c2
	 * !!! ПРЯМОУГОЛЬНИКИ
	 *
	 *  ^    ______________
	 *  |   |   ____      |
	 *  |   |  | c1 |     |
	 *  |   |  |.___|     |
	 *  |   |        c2   |
	 *  |   |.____________|
	 *
	 *
	 */

	var p1Overlapped = false,
		p2Overlapped = false,
		p3Overlapped = false,
		p4Overlapped = false;

	c1 = this.toClockwisePoints(c1);
	c2 = this.toClockwisePoints(c2);


	// Определим наложение
	if(c2[0][0] <= c1[0][0] && c2[0][1] >= c1[0][1]) p1Overlapped = true;
	if(c2[1][0] <= c1[1][0] && c2[1][1] <= c1[1][1]) p2Overlapped = true;
	if(c2[2][0] >= c1[2][0] && c2[2][1] <= c1[2][1]) p3Overlapped = true;
	if(c2[3][0] >= c1[3][0] && c2[3][1] >= c1[3][1]) p4Overlapped = true;

	if(p1Overlapped && p2Overlapped && p3Overlapped && p4Overlapped) return true;


	return false;
}

cRectangleContours.prototype.toClockwisePoints = function(rect){
	/**
	 * Возвращает прямоугольник в виде 4-х точек по часовой стрелки, начиная с левого нижнего угла
	 *
	 * 	 0,0 ______________
	 *  |   |             |
	 *  |   |             |
	 *  |   |             |
	 *  |   |             |
	 *  |   |.____________|
	 *
	 */
	var boundaryValues = function(rect){
		var xmin, ymin,
			xmax, ymax;

		for(var i = 0; i < rect.length; i++){
			if(typeof xmin === 'undefined') xmin = rect[i][0];
			if(typeof ymin === 'undefined') ymin = rect[i][1];

			if(rect[i][0] < xmin) xmin = rect[i][0];
			if(rect[i][1] < ymin) ymin = rect[i][1];


			if(typeof xmax === 'undefined') xmax = rect[i][0];
			if(typeof ymax === 'undefined') ymax = rect[i][1];

			if(rect[i][0] > xmax) xmax = rect[i][0];
			if(rect[i][1] > ymax) ymax = rect[i][1];
		}

		return {
			min: [xmin, ymin],
			max: [xmax, ymax]
		};
	};

	var rec = boundaryValues(rect);

	return [
		[rec.min[0], rec.max[1]],
		[rec.min[0], rec.min[1]],
		[rec.max[0], rec.min[1]],
		[rec.max[0], rec.max[1]]
	];

}


cRectangleContours.prototype.distinctPoints = function( items ){
	/** Удаляет дублирующиеся точки полигона **/
	// var items = pointSet;

	for (var i=0; i < items.length; i++) {
		var listI = items[i];
		loopJ: for (var j = 0; j < items.length; j++) {
			var listJ = items[j];
			if (listI === listJ) continue; //Ignore itself
			for (var k=listJ.length; k>=0; k--) {
				if (listJ[k] !== listI[k]) continue loopJ;
			}
			// At this point, their values are equal.
			items.splice(j, 1);
		}
	}


	return items;
};


cRectangleContours.prototype.convertPlaneToPointsSet = function(stripes){
	/**
	 * Конвертирует формы проекции в сплошной набор точек
	 */

	var pointsSet = [];

	for(var i = 0; i < stripes.length; i++){

		for(var j = 0; j < stripes[i].length; j++){
			pointsSet.push(stripes[i][j]);
		}

	}

	return this.distinctPoints(pointsSet);
}


cRectangleContours.prototype.dirPoints = function(point, dir, pointsSet){

	var sortNumber = function (a, b) {
		/** Вспомогательная функция для сортировки "по возрастанию" **/
		return a - b;
	};

	var dirPoints12H = function(point){
		/**
		 * Ищет точки, одинаковые с текущей в направлении -oY, сортирует точки по расстоянию от текущей
		 */

		var points12H = [],
			yPoints12H = [];


		for(var i = 0; i < pointsSet.length; i++){
			// Если из множества выбрана текущая точка - проскакиваем
			if(pointsSet[i][0] === point[0] && pointsSet[i][1] === point[1]) continue;

			// Если точки на одной оси с текущей и находится по направлению 12 часов (учетом направления Y для графики)
			if(pointsSet[i][0] === point[0] && pointsSet[i][1] < point[1]){
				yPoints12H.push(pointsSet[i][1]);
			}
		}

		// Отсортируем массив по возрастанию
		yPoints12H.sort(sortNumber);

		// А теперь сделаем, чтобы самой первой точкой в массиве была ближайшая точка к текущей
		yPoints12H.reverse();

		// Вернем массив как набор точек
		for(var i = 0; i < yPoints12H.length; i++){
			points12H.push([point[0], yPoints12H[i]]);
		}

		return points12H;
	};


	var dirPoints3H = function(point){
		/**
		 * Ищет точки, одинаковые с текущей в направлении +oX, сортирует точки по расстоянию от текущей
		 */

		var points3H = [],
			xPoints3H = [];

		for(var i = 0; i < pointsSet.length; i++){
			// Если из множества выбрана текущая точка - проскакиваем
			if(pointsSet[i][0] === point[0] && pointsSet[i][1] === point[1]) continue;

			// Если точки на одной оси с текущей и находится по направлению 3 часа (учетом направления X для графики)
			if(pointsSet[i][1] === point[1] && pointsSet[i][0] > point[0]){
				xPoints3H.push(pointsSet[i][0]);
			}
		}

		// Отсортируем массив по возрастанию
		xPoints3H.sort(sortNumber);


		// Вернем массив как набор точек
		for(var i = 0; i < xPoints3H.length; i++){
			points3H.push([xPoints3H[i], point[1]]);
		}

		return points3H;
	};


	var dirPoints6H = function(point){
		/**
		 * Ищет точки, одинаковые с текущей в направлении oY, сортирует точки по расстоянию от текущей
		 */

		var points6H = [],
			yPoints6H = [];

		for(var i = 0; i < pointsSet.length; i++){
			// Если из множества выбрана текущая точка - проскакиваем
			if(pointsSet[i][0] === point[0] && pointsSet[i][1] === point[1]) continue;

			// Если точки на одной оси с текущей и находится по направлению 6 часов (учетом направления Y для графики)
			if(pointsSet[i][0] === point[0] && pointsSet[i][1] > point[1]){
				yPoints6H.push(pointsSet[i][1]);
			}
		}

		// Отсортируем массив по возрастанию
		yPoints6H.sort(sortNumber);


		// Вернем массив как набор точек
		for(var i = 0; i < yPoints6H.length; i++){
			points6H.push([point[0], yPoints6H[i]]);
		}

		return points6H;
	};

	var dirPoints9H = function(point){
		/**
		 * Ищет точки, одинаковые с текущей в направлении -oX, сортирует точки по расстоянию от текущей
		 */

		var points9H = [],
			xPoints9H = [];

		for(var i = 0; i < pointsSet.length; i++){
			// Если из множества выбрана текущая точка - проскакиваем
			if(pointsSet[i][0] === point[0] && pointsSet[i][1] === point[1]) continue;

			// Если точки на одной оси с текущей и находится по направлению 9 часов (учетом направления X для графики)
			if(pointsSet[i][1] === point[1] && pointsSet[i][0] < point[0]){
				xPoints9H.push(pointsSet[i][0]);
			}
		}

		// Отсортируем массив по возрастанию
		xPoints9H.sort(sortNumber);

		// А теперь в обратную сторону, чтобы вернуть точки по мере удаления от текущей в направлении "стралки на 9-ть часов"
		xPoints9H.reverse();


		// Вернем массив как набор точек
		for(var i = 0; i < xPoints9H.length; i++){
			points9H.push([xPoints9H[i], point[1]]);
		}

		return points9H;
	};


	if(dir === '12h'){
		return dirPoints12H(point);
	}

	if(dir === '3h'){
		return dirPoints3H(point);
	}

	if(dir === '6h'){
		return dirPoints6H(point);
	}

	if(dir === '9h'){
		return dirPoints9H(point);
	}

}


cRectangleContours.prototype.crossedWithStripe = function(p1, p2, dir, stripes){
	/**
	 * dir: направление от точки p1 к точке p2, может принимать значения: "12h", "3h", "6h", "9h"
	 */
	var stripeRect = [];

	for(var i = 0; i < stripes.length; i++){
		stripeRect = stripes[i];

		if(dir === '12h'){
			// p1[0] == p2[0]

			if(
				p2[0] > stripeRect[0][0] && p2[0] < stripeRect[3][0] && // oX
					p1[1] > stripeRect[0][1] && p2[1] < stripeRect[0][1]){  // oY

				return true;
			}

		}


		else
		if(dir === '3h'){
			// p1[1] == p2[1]

			if(
				p2[1] < stripeRect[3][1] && p2[1] > stripeRect[2][1] && // oY
					p1[0] < stripeRect[0][0] &&  p2[0] > stripeRect[0][0]){  // oX

				return true;
			}

		}


		else
		if(dir === '6h'){
			// p1[0] == p2[0]

			if(
				p2[0] > stripeRect[0][0] && p2[0] < stripeRect[3][0] && // oX
					p1[1] < stripeRect[1][1] && p2[1] > stripeRect[1][1]){  // oY

				return true;
			}
		}


		else
		if(dir === '9h'){
			// p1[1] == p2[1]

			if(
				p2[1] < stripeRect[3][1] && p2[1] > stripeRect[2][1] && // oY
					p1[0] > stripeRect[3][0] &&  p2[0] < stripeRect[0][0]){  // oX

				return true;
			}

		}

	}

	return false;
}


cRectangleContours.prototype.getContours = function(stripes, ops){
	/**
	 *
	 * Находит минимальные замкнутые прямоугольные контуры (подмножества 4-х точек) из переданного множества точек
	 * stripes: набор лент фундамента
	 * ops: {
	 *      inside: true - оставить только те контуры, что находятся внутри множества точек
	 * }
	 */
	var _this = this;

	ops = (typeof ops === 'undefined') ? {} : ops;
	ops.inside = (typeof ops.inside === 'undefined') ? false : ops.inside;



	/** БЕЗ ЭТОЙ ВХОДНОЙ ОПЕРАЦИИ ОСТАЛЬНОЙ КОД РАБОТАТЬ НЕ БУДЕТ **/
	/** ПО ЧАСОВОЙ СТРЕЛКЕ: Упорядочем точки отдельных прямоугольников **/
	for(var i = 0; i < stripes.length; i++){
		stripes[i] = this.toClockwisePoints(stripes[i]);
	}
	/***************************************************************/



	// "Превратим" ленты фундамента в набор точек углов прямоугольников каждой из лент
	var pointsSet = this.convertPlaneToPointsSet(stripes);


	var compute = function() {
		// Найденные контуры
		var contours = [];

		// Единичный прямоугольник
		var recPoints = [];

		// Перебираем каждую точку и на основании ближайших строим контур "по часовой стрелки"
		var points12H = [],
			points3H = [],
			points6H = [],
			points9H = [];

		var i12 = 0,
			i3 = 0,
			i6 = 0;

		// Начнем перебирать все имеющиеся точки по очереди
		for(var i = 0; i < pointsSet.length; i++){
			// Очистим массивы для поиска нового контура
			recPoints = [];

			points12H = [],
				points3H = [],
				points6H = [],
				points9H = [];


			// Первая точка, теоретического прямоугольника
			recPoints[0] = pointsSet[i];


			// Попробуем собрать точки на 12-ть часов от текущей
			points12H = _this.dirPoints(recPoints[0], '12h', pointsSet);

			/**** 1-я точка подошла (поворот на 12 часов) *****/
			if(points12H.length){
				// Если были найдены точки на 12-ть часов от текущей (первой точки прямоугольника)

				i12 = 0;


				while(i12 < points12H.length && !points3H.length && !recPoints[3] && !_this.crossedWithStripe(recPoints[0], points12H[i12], '12h', stripes)){

					// Попробуем собрать точки на 3-и часа, от любой из точек на 12-ть часов
					points3H = _this.dirPoints(points12H[i12], '3h', pointsSet);


					/**** 2-я точка подошла (поворот на 3 часа) ****/
					if(points3H.length){
						// Если были найдены точки на 3-и часа от одной из точек на 12-ть часов

						// Тогда мы знаем вторую точку прямоугольника
						recPoints[1] = points12H[i12];


						i3 = 0;
						while(i3 < points3H.length && !points6H.length && !recPoints[3] && !_this.crossedWithStripe(recPoints[1], points3H[i3], '3h', stripes)){

							// Попробуем собрать точки на 6-ть часов, от любой из точек на 3-и часа
							points6H = _this.dirPoints(points3H[i3], '6h', pointsSet);

							/**** 3-я точка подошла (поворот на 6 часов) ****/
							if(points6H.length){
								// Если были найдены точки на 6-ть часов от одной из точек на 3-и часа

								// Тогда мы знаем третью точку прямоугольника
								recPoints[2] = points3H[i3];

								// Переберм все точки на 6-ть часов и проверим, было ли совпадение по Y с начальной точкой
								i6 = 0;
								while(i6 < points6H.length && !recPoints[3] && !_this.crossedWithStripe(recPoints[2], points6H[i6], '6h', stripes)){

									if(points6H[i6][1] === recPoints[0][1] && !_this.crossedWithStripe(points6H[i6], recPoints[0], '9h', stripes)){

										// Тогда мы знаем четвертую (последнюю) точку прямоугольника
										recPoints[3] = points6H[i6];

										// Внесем точки в массив найденных контуров
										contours.push(recPoints);
									}

									i6++;
								}
							}

							i3++;
						}

					}

					i12++;
				}

			}

		}

		return contours;
	};



	var lineSegmentOwners = function(p1, p2){
		/**
		 * Определяет принадлежность отрезка, заключенного между точками p1 и p2 к лентам фундамента
		 * Если отрезок не принадлежит ни к одной ленте, функция возвращает 0
		 * В случае принадлжености к одно или более лент, функция возращает N - число лент, к которым принадлежит отрезок
		 *
		 * Принадлежность к ленте определеяется принадлежностью отрезка к контуру ленты фундамента
		 */

		var nonVertical = false,
			nonHorizontal = false;

		// Если отрезок "не вертикальный"
		if(!(p1[0] === p2[0] && p1[1] !== p2[1])) nonVertical = true;

		// Если отрезок "не горизонтальный"
		if(!(p1[0] !== p2[0] && p1[1] === p2[1])) nonHorizontal = true;

		// Если отрезок "не вертикальный" и "не горизонтальный" - значит он не принадлежит никакой ленте
		if(nonVertical && nonHorizontal) return 0;

		// Если отрезок - точка
		if(p1[0] === p2[0] && p1[1] === p2[1]) return 0;

		// Проверим принадлежность
		var ownersCount = 0;

		// Границы отрезка между линиями
		var segmentMinX = (p1[0] > p2[0]) ? p2[0] : p1[0],
			segmentMaxX = (p1[0] > p2[0]) ? p1[0] : p2[0],
			segmentMinY = (p1[1] > p2[1]) ? p2[1] : p1[1],
			segmentMaxY = (p1[1] > p2[1]) ? p1[1] : p2[1];

		var stripeMaxX = null,
			stripeMinX = null,
			stripeMaxY = null,
			stripeMinY = null;

		var onStripe = false;

		if(p1[0] === p2[0]){
			/** Вертикальные линии **/

			for(var i = 0; i < stripes.length; i++){

				if(stripes[i][0][0] === p1[0]){
					// Отрезок и грань полосы фундамента лежат на одной линии (левая грань полосы фундамента)
					stripeMinY = stripes[i][1][1];
					stripeMaxY = stripes[i][0][1];

					onStripe = true;
				}
				else if(stripes[i][3][0] === p1[0]){
					// Отрезок и грань полосы фундамента лежат на одной линии (правая грань полосы фундамента)
					stripeMinY = stripes[i][2][1];
					stripeMaxY = stripes[i][3][1];

					onStripe = true;
				}
				else {
					// Значения для текущей ленты фундамента
					stripeMinX = stripes[i][0][0];
					stripeMaxX = stripes[i][3][0];

					stripeMinY = stripes[i][1][1];
					stripeMaxY = stripes[i][0][1];

					onStripe = false;
				}



				if(onStripe === true){
					// Лежит на грани ленты

					if((segmentMinY >= stripeMinY && segmentMaxY <= stripeMaxY) || // Отрезок является частью грани ленты фундамента
						(segmentMinY <= stripeMinY && segmentMaxY >= stripeMaxY)){ // Отрезок включается в себя грани лент фундамента

						ownersCount++;
					}

				}
				else {
					// Возможно пересекает какую-то ленту

					if((p1[0] < stripeMaxX && p1[0] > stripeMinX) && (segmentMinY <= stripeMinY && segmentMaxY >= stripeMaxY)){
						// Отрезок пересекает ленту

						// Передобавление владельца, т.к. линия может быть пересечение линии фундамента самой себя
						// и с одним пересечением не учтется ошибка обхода
						ownersCount++;
						ownersCount++;
					}
				}
			}

		}
		else{

			/** Горизонтальные линии **/

			for(var i = 0; i < stripes.length; i++){

				if(stripes[i][0][1] === p1[1]){
					// Отрезок и грань полосы фундамента лежат на одной линии (нижняя грань полосы фундамента)
					stripeMinX = stripes[i][0][0];
					stripeMaxX = stripes[i][3][0];

					onStripe = true;
				}
				else if(stripes[i][1][1] === p1[1]){
					// Отрезок и грань полосы фундамента лежат на одной линии (верхняя грань полосы фундамента)
					stripeMinX = stripes[i][1][0];
					stripeMaxX = stripes[i][2][0];

					onStripe = true;
				}
				else {
					// Значения для текущей ленты фундамента
					stripeMinX = stripes[i][0][0];
					stripeMaxX = stripes[i][3][0];

					stripeMinY = stripes[i][1][1];
					stripeMaxY = stripes[i][0][1];

					onStripe = false;
				}



				if(onStripe === true){
					// Лежит на грани ленты

					if((segmentMinX >= stripeMinX && segmentMaxX <= stripeMaxX) || // Отрезок является частью грани ленты фундамента
						(segmentMinX <= stripeMinX && segmentMaxX >= stripeMaxX)){ // Отрезок включается в себя грани лент фундамента

						ownersCount++;
					}

				}
				else {
					// Возможно пересекает какую-то ленту

					if((p1[1] < stripeMaxY && p1[1] > stripeMinY) && (segmentMinX <= stripeMinX && segmentMaxX >= stripeMaxX)){
						// Отрезок пересекает ленту

						// Передобавление владельца, т.к. линия может быть пересечение линии фундамента самой себя
						// и с одним пересечением не учтется ошибка обхода
						ownersCount++;
						ownersCount++;
					}
				}
			}

		}



		return ownersCount;
	};


	var insideContours = function(contours){
		/**
		 * Вернет только те конутры, что находятся внутри множества точек, т.е. окружены какими-то другим точками
		 */

		var insided = [],
			singleContour = [];

		var p1Inside = false,
			p2Inside = false,
			p3Inside = false,
			p4Inside = false;

		for(var i = 0; i < contours.length; i++){
			p1Inside = false;
			p2Inside = false;
			p3Inside = false;
			p4Inside = false;

			singleContour = contours[i];

			// Проверим, что контур находится внутри множества точек
			for(var j = 0; j < pointsSet.length; j++){

				if(singleContour[0][0] > pointsSet[j][0] && singleContour[0][1] < pointsSet[j][1]){
					p1Inside = true;
				}

				if(singleContour[1][0] > pointsSet[j][0] && singleContour[1][1] > pointsSet[j][1]){
					p2Inside = true;
				}

				if(singleContour[2][0] < pointsSet[j][0] && singleContour[2][1] > pointsSet[j][1]){
					p3Inside = true;
				}

				if(singleContour[3][0] < pointsSet[j][0] && singleContour[3][1] < pointsSet[j][1]){
					p4Inside = true;
				}


				if(p1Inside === true && p2Inside === true && p3Inside === true && p4Inside === true){
					insided.push(contours[i]);
					break;
				}
			}
		}

		return insided;
	};


	var outsideContour = function(innerContours){

		// Вспомогательная
		var indexOfPoint = function(point, points){

			for( var i = 0; i < points.length; i++ ){
				if( points[i][0] == point[0] && points[i][1] == point[1] ){
					return i;
				}
			}

			return -1;
		};

		// "Превратим" внутренние контуры фундамента в набор точек углов прямоугольников каждой из лент
		var pointsSetInner = _this.convertPlaneToPointsSet(innerContours);

		// Теперь "выкинем" pointsSetInner из общего набора точке
		var pointsSetOuter = [];
		for(var i = 0; i < pointsSet.length; i++){
			if(indexOfPoint(pointsSet[i], pointsSetInner) === -1){
				pointsSetOuter.push(pointsSet[i]);
			}
		}

		//TODO: Debug
		//var pointsSetOuter = _this.convertPlaneToPointsSet(stripes);

		// Удалим повторяющиеся точки, если имеются (они сбивают с толку алгоритм поиска контура, т.к. для lineSegmentOwners
		// повторы генерируют "разрыв" контура)
		pointsSetOuter = _this.distinctPoints(pointsSetOuter);

		// Отсортируем точки внешнего контура по "часовой стрелке". Для этого будем делать обход с поиском точек, подходящего
		// направления методом перебора направлений по "часовй стрелке" от текущего направления. Начинать обход будем с
		// самой нижней левой точки.

		// Определим точку обхода (САМАЯ НИЖНЯЯ левая точка)
		var minX, maxY;
		for (var i = 0; i < pointsSetOuter.length; i++){
			if(typeof maxY === 'undefined') maxY = pointsSetOuter[i][1];

			if(maxY < pointsSetOuter[i][1]) maxY = pointsSetOuter[i][1];

			if(maxY === pointsSetOuter[i][1]){
				if(typeof minX === 'undefined') minX = pointsSetOuter[i][0];

				if(minX > pointsSetOuter[i][0]) minX = pointsSetOuter[i][0];
			}
		}
		var startPoint = [minX, maxY];



		/** Будем ходить по точкам до тех пор, пока последняя найденная точка не окажется startPoint **/
		// + добавим подстраховку от зависаний, что кол-во проходов не может быть больше чем количество всех точек
		// в множестве

		var contourPointSet = [startPoint];

		var pointsByDir = [];

		var index = 0;

		var p1 = [],
			p2 = [];

		var dir = '12h',
			lastDir = dir;

		var ownersCount = 0;

		// var pointsSet2 = _this.convertPlaneToPointsSet(stripes);

		var i = 0,
			pointSetCount = pointsSetOuter.length;



		//// debug.log(pointsSetOuter);
		// debug.log(pointsSetOuter);
		// debug.log('-----------------');
		// console.log(pointsSetOuter);

		while(pointSetCount * 4){ // на четыре варианта перебора по разным "часовым" направлениям

			// debug.log({rotPoint: contourPointSet[i]});

			pointsByDir = _this.dirPoints(contourPointSet[i], dir, pointsSetOuter);

			// debug.log('lastDir: ' + lastDir);
			// debug.log('dir: ' + dir);
			// debug.log({pointsByDir: pointsByDir});


			// Перебираем точки на N-часов (12, 3, 6, 9) до тех пор, пока они не закончатся либо не прервется линия (пустота или
			// пересечение с лентой фундамента)
			index = 0;
			while(index < pointsByDir.length){
				if(index === 0){
					// Первый шаг в направлении
					p1 = contourPointSet[i];
					p2 = pointsByDir[index];
				}
				else {
					p1 = pointsByDir[index - 1];
					p2 = pointsByDir[index];
				}

//				// debug.log(p1);
				// debug.log({segment: [p1, p2]});
				// debug.log('');

				ownersCount = lineSegmentOwners(p1, p2);
				// debug.log('ret: ' + ownersCount);
				// debug.log('');

				//console.log({
				//	p1: p1,
				//	p2: p2,
				//	ownersCount: ownersCount
				//});

				if(ownersCount !== 1) {
					// Если текущий отрезок линии принадлежит более чем одной полосе фундамента lineSegmentOwners > 1
					// или когда (разрыв) - не принадлежит ни одной полосе фундамента lineSegmentOwners = 0
					// Значит, пора прерваться и сменить направление

					break;
				}

				index++;
			}

			// Найдена актуальная точка поворота
			if(index > 0){
				i++;
				contourPointSet[i] = pointsByDir[index - 1];
				lastDir = dir;
			}

			/** ВАЖНЫЙ НАБОР (без него путаница в направлениях, алгоритм может вернуться в направление, откуда пришел) **/
			// Сменим направление
			if(dir === '12h') {
				if(lastDir === '9h') dir = '6h';
				else dir = '3h';
			}
			else if(dir === '3h'){
				if(lastDir === '12h') dir = '9h';
				else dir = '6h';
			}
			else if(dir === '6h'){
				if(lastDir === '3h') dir = '12h';
				else dir = '9h';
			}
			else if(dir === '9h'){
				if(lastDir === '6h') dir = '3h';
				else dir = '12h';
			}


			pointSetCount--;

			// Последняя найденная точка - это стартовая точка
			if(contourPointSet[0][0] === contourPointSet[contourPointSet.length - 1][0] &&
				contourPointSet[0][1] === contourPointSet[contourPointSet.length - 1][1])
			{
				contourPointSet.splice(-1,1);
				break;
			}
		}


		// debug.log('>>>>');
		// debug.log(contourPointSet);

		return [contourPointSet];
	}




	// Получим все контуры
	var contours = compute();


	// Оставим только контуры замкнутые внутри множества точек
	var contoursInside = insideContours(contours);

	// Методом вычитания контуров (из всех вычитаем контуры лент фундамента), получим пустоты внутри
	var innerContours = this.diffRectangles(contoursInside, stripes);

	// Вычтем из множества точек, точки, принадлежащие внутренним контурам, так получим точки внешнего контура,
	// их нужно будет упорядочить обходом по часовой стрелке
	var outerContours = outsideContour(innerContours);


	return {
		inner: innerContours,
		outer: outerContours
	};
}


