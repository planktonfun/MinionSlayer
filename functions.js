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

function left( mchar ) {
  mchar.setX(mchar.getX() - 3);
}

function right( mchar ) {
  mchar.setX(mchar.getX() + 3);
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

function isFunction(functionToCheck) {
	var getType = {};
	return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

var serialize = function(data) {   
  var _thisObject = this;     
    var f = function(data) {
        var str_data;

        if (data == null || 
            (typeof(data) == 'string' && data == '')) {
            str_data = 'N;';
        }

        else switch(typeof(data)) {
            case 'object':
                var arrayCount = 0;
                str_data = '';

                for (i in data) {
                    if (i == 'length') {
                        continue;
                    }
                    
                    arrayCount++;
                    switch (typeof(i)) {
                        case 'number':
                            str_data += 'i:' + i + ';' + f(data[i]);
                            break;

                        case 'string':
                            str_data += 's:' + i.length + ':"' + i + '";' + f(data[i]);
                            break;

                        default:
                            showMessage(Element('cc_msg_err_serialize_data_unknown').value);
                            break;
                    }
                }

                if (!arrayCount) {
                    str_data = 'N;';    
                }
                else {
                    str_data = 'a:' + arrayCount + ':{' + str_data + '}';
                }
                
                break;
        
            case 'string':
                str_data = 's:' + data.length + ':"' + data + '";';
                break;
                
            case 'number':
                str_data = 'i:' + data + ';';
                break;

            case 'boolean':
                str_data = 'b:' + (data ? '1' : '0') + ';';
                break;

            default:
                showMessage(Element('cc_msg_err_serialize_data_unknown').value);
                return null;
        }

        return str_data;
    }

    return f(data);
}

//Unserialize Data Method
var unserialize = function(str) {
    _thisObject = this;
    var matchB = function (str, iniPos) {
        var nOpen, nClose = iniPos;
        do {
            nOpen = str.indexOf('{', nClose+1);
            nClose = str.indexOf('}', nClose+1);

            if (nOpen == -1) {
                return nClose;
            }
            if (nOpen < nClose ) {
                nClose = matchB(str, nOpen);
            }
        } while (nOpen < nClose);

        return nClose;
    }

    var f = function (str) {
        switch (str.charAt(0)) {
            case 'a':
                var data = new Array();
                var n = parseInt( str.substring(str.indexOf(':')+1, str.indexOf(':',2) ) );
                var arrayContent = str.substring(str.indexOf('{')+1, str.lastIndexOf('}'));
                for (var i = 0; i < n; i++) {
                    var pos = 0;

                    /* Process Index */
                    var indexStr = arrayContent.substr(pos, arrayContent.indexOf(';')+1);
                    var index = f(indexStr);
                    pos = arrayContent.indexOf(';', pos)+1;
                    
                    /* Process Content */
                    var part = null;
                    switch (arrayContent.charAt(pos)) {
                        case 'a':
                            var pos_ = matchB(arrayContent, arrayContent.indexOf('{', pos))+1;
                            part = arrayContent.substring(pos, pos_);
                            pos = pos_;
                            data[index] = f(part);
                            break;
                    
                        case 's':
                            var pval = arrayContent.indexOf(':', pos+2);
                            var val  = parseInt(arrayContent.substring(pos+2, pval));
                            pos = pval + val + 4;
                            data[index] = arrayContent.substr(pval+2, val);
                            break;

                        default:
                            part = arrayContent.substring(pos, arrayContent.indexOf(';', pos)+1);
                            pos = arrayContent.indexOf(';', pos)+1;
                            data[index] = f(part);
                            break;
                    }
                    arrayContent = arrayContent.substr(pos);
                }
                break;
                
            case 's':
                var pos = str.indexOf(':', 2);
                var val = parseInt(str.substring(2,pos));
                var data = str.substr(pos+2, val);
                str = str.substr(pos + 4 + val);
                break;

            case 'i':
            case 'd':
                var pos = str.indexOf(';');
                var data = parseInt(str.substring(2,pos));
                str = str.substr(pos + 1);
                break;
            
            case 'N':
                var data = null;
                str = str.substr(str.indexOf(';') + 1);
                break;

            case 'b':
                var data = str.charAt(2) == '1' ? true : false;
                break;
        }
        return data;
    }

    return f(str);
}