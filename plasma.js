var Plasma = (function() {
    "use strict";

    var size      = { w: 128, h: 128 };
    var halfSize  = { w: size.w / 2, h: size.h / 2 };
    var numPoints = size.w * size.h;
    var zoom = 4;
    
    var context;
    var palContext;

    var palette;
    var time = 0;
    var pointData;
    var sinTable;

    var init = function() {
        var canvas  = document.getElementById('plasma');
        canvas.width  = size.w;
        canvas.height = size.h;
        canvas.style.width  = size.w * zoom + 'px';
        canvas.style.height = size.h * zoom + 'px';
        
        context = canvas.getContext('2d');
        context.fillStyle = 'rgba(0,0,0,1)';
        context.fillRect(0, 0, size.w, size.h);

        var palCanvas = document.getElementById('palette');
        palCanvas.width = 512;
        palCanvas.height = 32;
        palContext = palCanvas.getContext('2d');
        
        generateLookups();
        palette = createPalette();
        pointData = new Uint8Array(numPoints);
    };

    var animate = function() {
        var startTime = new Date().getTime();
        update();
        redraw();

        var timeLeft = 40 - (new Date().getTime() - startTime);
        window.setTimeout(function() { animate(); }, timeLeft);
    };
    
    var generateLookups = function() {
        sinTable = [];
        
        for(var i=0; i <= 1000; i++)
            sinTable.push(Math.sin(i * ((Math.PI*2) / 1000)));
    };
    
    var getSin = function(x) {
        var sign = (x < 0) ? -1 : 1;
        x = Math.abs(x % (Math.PI*2));
        return sinTable[Math.floor(x * (1000 / (Math.PI*2)) )] * sign;
    };
    
    var getCos = function(x) {
        return getSin(x + (Math.PI/2));
    };
    
    var update = function() {
        time += 0.01;

        var pointIdx = 0;
        var val;

        // Moving centre point
        var centreX = halfSize.w + getSin(time * 1) * halfSize.w;
        var centreY = halfSize.h + getSin(time * 2) * halfSize.h;

        for(var y = 0; y < size.h; y++) {
            for(var x = 0; x < size.w; x++) {
                val  = getSin(x/16 + time);
                val += getSin( (time + (x * getSin(time/2)) + y * getCos(time)) / 32);
                val += getSin(distance(x, y, centreX, centreY) / 16);

                pointData[pointIdx++] = clampInt(val * 256);
            }
        }
    };
    
    var distance = function(x1, y1, x2, y2) {
        var diffX = x2 - x1;
        var diffY = y2 - y1;
        return Math.sqrt((diffX * diffX) + (diffY * diffY));
    };

    var redraw = function() {
        var imageData = context.getImageData(0, 0, size.w, size.h);
        var pixData = imageData.data;
        var dataPtr = 0;
        var numPix  = numPoints * 4;
        
        for(var pixPtr=0; pixPtr < numPix; pixPtr += 4) {
            var pointVal = pointData[dataPtr];
            pixData[pixPtr  ] = palette[pointVal].r;
            pixData[pixPtr+1] = palette[pointVal].g;
            pixData[pixPtr+2] = palette[pointVal].b;
            dataPtr++;
        }
        
        context.putImageData(imageData, 0, 0);
    };

    var createPalette = function() {
        var palette = [];
        
        for(var i=0; i < 256; i++) {
            palette[i] = new PaletteEntry(
                127 + Math.cos(Math.PI * i / 128) * 128,
                127 + Math.sin(Math.PI * i / 128) * 128,
                i/2
            );
            
            palContext.fillStyle = 'rgb(' + palette[i].r + ',' +
                                            palette[i].g + ',' +
                                            palette[i].b + ')';
            palContext.fillRect(i * 2, 0, 2, 32);
        }
        
        return palette;
    };
    
    var clampInt = function(num) {
        return Math.abs(num) & 0xFF;
    };
    
    function PaletteEntry(r, g, b) {
        this.r = clampInt(r);
        this.g = clampInt(g);
        this.b = clampInt(b);
    }
    
    // Return public method
    return {
        start: function() {
            init();
            animate();
        }
    };
})();