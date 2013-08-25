// make an update, render and collision handler, active and inactive


  // RequestAnimFrame: a browser API for getting smooth animations
  window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       || 
      window.webkitRequestAnimationFrame || 
      window.mozRequestAnimationFrame    || 
      window.oRequestAnimationFrame      || 
      window.msRequestAnimationFrame     ||  
      function( callback ){
        return window.setTimeout(callback, 1000 / 60);
      };
  })();

  window.cancelRequestAnimFrame = ( function() {
    return window.cancelAnimationFrame          ||
      window.webkitCancelRequestAnimationFrame    ||
      window.mozCancelRequestAnimationFrame       ||
      window.oCancelRequestAnimationFrame     ||
      window.msCancelRequestAnimationFrame        ||
      clearTimeout
  } )();


function headbutt( mchar ) {
  mchar.setAnimation('headbutt');
  mchar.afterFrame(2, function () {
  mchar.setAnimation('idle');
  });          
}

function punch( mchar ) {
  mchar.setAnimation('punch');
  mchar.afterFrame(2, function () {
    mchar.setAnimation('idle');
  });          
}

function up( mchar, speed ) {
  mchar.setY(mchar.getY() - speed);
}

function down( mchar, speed ) {
  mchar.setY(mchar.getY() + speed);
}

function left( mchar, speed ) {
  mchar.setX(mchar.getX() - speed);
}

function right( mchar, speed ) {
  mchar.setX(mchar.getX() + speed);
}

function jump( mchar ) {
   mchar.setY(mchar.getY() - 50);
  setTimeout(function () {
    mchar.setY(mchar.getY() + 50)
  }, 100);
}

//chatcontainer
function addChatC( cn, message ) {
  var chatcontainer = document.getElementById('chatcontainer');    
  chatcontainer.innerHTML = cn + ':' + message + '<br>' + chatcontainer.innerHTML;
}

function Particle( stage ) {	
  		this.x = Math.random() * stage.getWidth();
  		this.y = Math.random() * stage.getHeight();

  		this.xvel = Math.random() * 5 - 2.5;
  		this.yvel = Math.random() * 5 - 2.5;

      // prevent getting stuck when reversing direction
      this.xcc = true;
      this.xlc = true;
      this.ycc = true;
      this.ylc = true;
      this.cc  = true;
      this.lc  = true;
}

Particle.prototype.update = function( stage ) {
	this.x += this.xvel;
	this.y += this.yvel;

	this.yvel += 0.1;

	// increment a negative if it gets to the boundaries
	if (this.x > stage.getWidth() || this.x < 0 ) {
		if( this.xlc == this.xcc ) { 
		  this.xvel = -this.xvel;          
		  this.xcc = !this.xcc;      
		}
	} else {
		this.xlc = this.xcc;
	}

	if (this.y > stage.getHeight() || this.y < 0 ) {
		if( this.ylc == this.ycc ) {
		  this.yvel = -this.yvel;   
		  this.ycc = !this.ycc;
		}       
	} else {
		this.ylc = this.ycc;
	}      

};

function check_collision( obj1, obj2 ) {
  // detect collision
  var x1 = obj1.getX() * 1,
      y1 = obj1.getY() * 1,
      h1 = obj1.getWidth() * 1,
      w1 = obj1.getHeight() * 1,
      x2 = obj2.getX() * 1,
      y2 = obj2.getY() * 1,
      h2 = obj2.getWidth() * 1,
      w2 = obj2.getHeight() * 1;

  if( x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2 ) {      
    return true; // The objects are touching
  }
  else {
    return false;
  }

}

function fetch_random(obj) {
    var temp_key, keys = [];
    for(temp_key in obj) {
       if(obj.hasOwnProperty(temp_key)) {
           keys.push(temp_key);
       }
    }
    return obj[keys[Math.floor(Math.random() * keys.length)]];
}

function isFunction(functionToCheck) {
	var getType = {};
	return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}


// LZW-compress a string
function lzw_encode(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i=1; i<data.length; i++) {
        currChar=data[i];
        if (dict[phrase + currChar] != null) {
            phrase += currChar;
        }
        else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase=currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (var i=0; i<out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}

// Decompress an LZW-encoded string
function lzw_decode(s) {
    var dict = {};
    var data = (s + "").split("");
    var currChar = data[0];
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;
    for (var i=1; i<data.length; i++) {
        var currCode = data[i].charCodeAt(0);
        if (currCode < 256) {
            phrase = data[i];
        }
        else {
           phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
        }
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
    }
    return out.join("");
}