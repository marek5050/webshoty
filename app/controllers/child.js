var locomotive = require('locomotive')
  , Controller = locomotive.Controller;

var ApiController = new Controller();
var sys = require('sys')
var exec = require('child_process').exec;
var webshot = require('webshot');
var easyimg = require('easyimage');
///apt-get install imagemagick
var async = require('async');
var Account = require('../models/account');
var Img = require('../models/images');
var fs = require('fs');
var FB = require('fb');
var linkscrape = require('linkscrape');
var request = require('request');
var workerFarm = require('worker-farm')
var options = {
     windowSize: {
                    width: 1200,
                    height: 800
                },
                shotSize: {
                    width: 'all',
                    height: 'all'
                }
}

function getLinks(url,cb)
{
 
    request(url, function(err, resp, body){
        if(err)
        {
            console.log(err)
            cb(err,null)
            return;
        }
linkscrape(url, body, function(links, $){
	links.push({link:url});
cb(null,links)
})
})
}

function makeSnapShot(url,cb)
{
		console.log('MAKING SNAPSHOT '+url)

if(url == '' || url == undefined)
{
	cb(null,null);
	return;
}
var unix = Math.round(new Date().getTime()) / 1000;
var name = unix+'.png';
var thumbnail = 'public/shots/thumbnails/'+name;
var thumbnailOutput = 'shots/thumbnails/'+name;
var regular = 'public/shots/'+name;
var regularOutput = 'shots/'+name;


    webshot(url, regular,regular, function(err) {
    	console.log(err)
    	console.log('snap shot made '+regular)
    if(err)
    {
    // self.res.send({type:'error',response:err});
    cb(err,null);
    return;
    }
    cb(null,regularOutput);

})
}
function uploadFB(album,image,page,cb)
{
console.log('UPLOADING FB'+image)
if(image === '' || image === null)
{
	console.log('empty')
	cb(null,null);
}



try{
var imgURL="http://webshoty.com/"+image;//change with your external photo url
FB.api('/'+page.id+'/photos', 'post', {
    url:imgURL,
access_token:page.token
}, function(response){

console.log(response)
cb(null,image)
});
}catch(e)
{

    console.log(e)
console.log('HERE')
cb(null,image)
        // self.res.send({type:'success',response:regularOutput});
}
}




module.exports = function (url,page, endWorker) {

    var self = this;
    var count = 0;

console.log('CHILD PRPCESS ' +url)





 getLinks(url,function(e,links){
    if(e)
    {
  endWorker(e);
    return;
    }

var len = links.length < 100 ? links.length : 100;
async.whilst(
    function () { console.log('CHECK ' + count +' < '+len);return count < len; },
    function (callback) {
    	count++;
console.log(count)
    	    	console.log(links[count])
if(links[count] == undefined)
{
	callback('error')
	return;
}
    var link = links[count].link;
makeSnapShot(link,function(err,image){
	        console.log('MAKE SNAPSHOT DONE')

    if(err)
    {
    	console.log('ERROR')
    	console.log(err);
callback()
    }
    
    uploadFB(null,image,page,function(err,image){
        console.log('UPLAOD FB DONE')

        if(err)
        {
        	console.log(err)
        	    	console.log('ERROR')

            callback();
         
        }
           callback();
    })

})
        
        
    },
    function (err) {
    	console.log(err)
    	console.log('END PROCESS')
        if(err)
        {
        	console.log(err)
//self.res.send({type:'error',response:err});

          endWorker(err)

return;
        }
          endWorker(err,null)

  
    });
  })









}