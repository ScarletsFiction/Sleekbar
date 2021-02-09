var sass = require('node-sass');
var fs = require('fs');
const { minify } = require("terser");

sass.render({
  file: './src/sleekbar.scss',
  outFile: './dist/sleekbar.min.css',
  sourceMap: true,
  outputStyle: 'compressed'
}, function(err, result) {
	fs.writeFile('./dist/sleekbar.min.css', result.css, function(err){
	    if(err) console.error(".css write error");
	});
	fs.writeFile('./dist/sleekbar.min.css.map', result.map.toString(), function(err){
	    if(err) console.error(".css.map write error");
	});
});

void async function(){
	let file = fs.readFileSync('./src/sleekbar.js');
	var result = await minify(file.toString('utf8'), {
		sourceMap: {
	        filename: "sleekbar.min.js",
	        url: "sleekbar.min.js.map"
	    }
	});

	fs.writeFile('./dist/sleekbar.min.js', result.code, function(err){
	    if(err) console.error(".js write error");
	});
	fs.writeFile('./dist/sleekbar.min.js.map', result.map, function(err){
	    if(err) console.error(".js.map write error");
	});
}();