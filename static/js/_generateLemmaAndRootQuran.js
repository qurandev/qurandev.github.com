var getLine = function(lineno, TOKEN){
	var line = '', token = 'ROOT:';  if(typeof(TOKEN)!='undefined' && TOKEN) token = TOKEN;
	$.each( gq.strings[lineno].split('★'), 
		function(data, data1){ 
			if(!data1) return;
			if(data1.indexOf(token) == -1){ line += '- '; }
			else{ data1 = data1.split( token )[1];
				if(!data1.indexOf('|') == -1){ alert('no pipe sep: ' + lineno); debugger; }//check for | ??
				data1 = data1.split('|')[0]; 
				line += data1 + ' ';//console.log(data + data1); 
			}
		});
	return line;
}

var lineno = 1, out = '';
for(lineno = 1; lineno < 10001; ++lineno){
	try{ out += ( getLine(lineno, 'LEM:') ) + '\n';
	}catch(e){
		console.log( 'ERROR ' + lineno + ' - '+ e); lineno = 100001; //i.e. exit loop
	}
}alert( out );