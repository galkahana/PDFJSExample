var $contentLayer = $('#content-layer'),
    $pdfpreviewCanvas = $('.pdf-preview>canvas'),
    pdfURL = document.location + "OoPdfFormExample.pdf",
    ignoreClick = false;


var stateLayerFunction = getDefaultLayerClickMethod();

function getDefaultLayerClickMethod() {
    return createTextFieldInMousePosition;
}

function doContentLayerClick(event) {
    if(event.target !== $contentLayer[0] && event.target !== $pdfpreviewCanvas[0])
        return;

    stateLayerFunction = stateLayerFunction(event);
}

var originScroll;

function saveScroll() {
    originScroll = {x:document.body.scrollLeft,y:document.body.scrollTop};
}

function restoreScroll() {
    document.body.scrollLeft = originScroll.x;
    document.body.scrollTop = originScroll.y;
}


function createTextFieldInMousePosition(event) {
    if(!ignoreClick) {
        saveScroll();
        createTextField(event.offsetX,event.offsetY);
        restoreScroll();
    }
    return createTextFieldInMousePosition;
}

function createImageFieldInMousePosition(event) {
    if(!ignoreClick) {
        saveScroll();
        latestImagePlacementEventOffset = {x:event.offsetX,y:event.offsetY};
        $('#image-select-modal').modal('show');
    }
    return createImageFieldInMousePosition;
}


var latestImagePlacementEventOffset = null;

function selectImageURL() {
    $('#image-select-modal').modal('hide');
    var imageURL = $('#image-select-modal input[type=url]').val();

    if(imageURL && imageURL.length > 0) {
        createImageField(latestImagePlacementEventOffset.x,latestImagePlacementEventOffset.y,imageURL);
        restoreScroll();
    }
}

function setTextTool() {
    clearTools();
    setActiveTool('text-tool');
    stateLayerFunction = createTextFieldInMousePosition;
}

function setImageTool() {
    clearTools();
    setActiveTool('image-tool');
    stateLayerFunction = createImageFieldInMousePosition;
}

function clearTools() {
    $('.tools').removeClass('active');
}

function setActiveTool(toolClass) {
    $('.' + toolClass).addClass('active');
}

function selectPDF() {
    $(".url-select").removeClass('hide');
}

var global = pdfjsDistBuildPdf;
var api = pdfjsDistBuildPdf.PDFJS;
var kPageScale = 1.5;

function setupPreview() {
    /*$('.pdf-preview').html('"<object data="' + pdfURL + '"' + 
                    ' type="application/pdf"' + 
                    ' class="full-screen">' + 
                    'This browser does not support PDF preview, so i cant help you. sorry. try with chrome' + 
                '</object>');*/

    global.PDFJS.workerSrc = './pdf.worker.js';

    if(!pdfURL)
        return


  // Fetch the PDF document from the URL using promises. (applying cors header for external requests via general applier)
  api.getDocument({ url: pdfURL.startsWith(document.location) ? pdfURL : 'https://corsanywhere.herokuapp.com/' + pdfURL}).then(function (pdf) {
    // Fetch the page.
    pdf.getPage(1).then(function (page) {
      var viewport = page.getViewport(kPageScale);

      // Prepare canvas using PDF page dimensions.
      var canvas = $('.pdf-preview>canvas')[0];
      var context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page into canvas context.
      var renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      page.render(renderContext);
    });
  });    
}

function replaceURL() {
    if($(".url-select [type=url]").val())
    	pdfURL = $(".url-select [type=url]").val();
    $(".url-select").addClass('hide');
    setupPreview();
};

function nevermindURL() {
    $(".url-select").addClass('hide');
}

function createTextField(x,y) {
    var $el = $('<div class="text-area-wrapper"><div><button type="button" class="close text-area-remove" aria-label="Close"><span aria-hidden="true">&times;</span></button></div><textarea class="text-field" rows="2" cols="10"></textarea></div>')
        .appendTo($contentLayer)
        .draggable();

    // remove by pressing X
    $el        
        .find('.text-area-remove')
        .click(function() {
            $(this).parent().parent().remove();
        });

    // focus on textarea
    var elTextArea =  $el.find('textarea')[0];



    $(elTextArea)
        .resizable({handles: "se",
            start: ignoreTools,
            stop: cancelIgnoreTools})
        .focus()
        .parent()
        .css({
            paddingBottom:0, // cancel ui-wrapper bottom padding cause i'm bringing the resize icon higher
            height:'auto'
        });

    // posit so text area is right on the clicked position
    $el
    .css({
        position:'absolute',
        top:0,
        left:0
    });

    $el
        .css({
            top:(y - elTextArea.parentElement.offsetTop - elTextArea.offsetTop - 0.3*kFontSize) + 'px',
            left:(x - elTextArea.parentElement.offsetLeft) + 'px'
        })        
}

function ignoreTools() {
    ignoreClick = true;
}

function cancelIgnoreTools() {
    setTimeout(function() {
        ignoreClick = false;
    },0);
}

function createImageField(x,y,url) {
    var $el = $('<div class="image-wrapper"><div><button type="button" class="close image-remove" aria-label="Close"><span aria-hidden="true">&times;</span></button></div><img class="image-field" src="' + url +'"></img></div>')
        .appendTo($contentLayer)
        .draggable();

    // remove by pressing X
    $el        
        .find('.image-remove')
        .click(function() {
            $(this).parent().parent().remove();
        });

    var $elImage =  $el.find('img'),
        elImage = $elImage[0];

    $el.css({visibility:'hidden'});

    $elImage.on('load',function() {

        $el
            .css({
                visibility:'visible'
            });
        

        $elImage
            .resizable({handles: "se",
                start: ignoreTools,
                stop: cancelIgnoreTools})
            .parent()
            .css({
                paddingBottom:0, // cancel ui-wrapper bottom padding cause i'm bringing the resize icon higher
                height:'auto',
            });



        // posit so text area is right on the clicked position
        $el
        .css({
            position:'absolute',
            top:0,
            left:0
        });

        $el
            .css({
                top:(y - elImage.parentElement.offsetTop - elImage.offsetTop) + 'px',
                left:(x - elImage.parentElement.offsetLeft) + 'px'
            })        

    });
}

function screenToPt(x) {
    return x/kPageScale;
}

var kFontSize = 14;

var defaultFontOptions = {
                            "fontSource": "arial",
                            "size": screenToPt(kFontSize),
                            "color": "black"
                        };




function fieldBoxesToPDFBoxes() {
    return _.filter(_.map($contentLayer.find('.text-field,.image-field'),function(item) {
        var pageOrigin = $('#page-origin').offset();
            
        if(!pageOrigin) pageOrigin = {left:0,top:0};

        if($(item).is('.text-field')) {
            // text field
            var textArea = item;

            if(textArea.value.length == 0)
                return null

            return createDefaultPDFTextBox(
                screenToPt(textArea.offsetLeft + textArea.parentElement.offsetLeft + textArea.parentElement.parentElement.offsetLeft + 1 - pageOrigin.left),
                screenToPt(textArea.offsetTop + textArea.parentElement.offsetTop + textArea.parentElement.parentElement.offsetTop + 1 + 0.3*kFontSize - pageOrigin.top),
                screenToPt(textArea.clientWidth),
                screenToPt(textArea.clientHeight),
                textArea.value,
                !!textArea.dir ? textArea.dir : 'ltr');
        }
        else {
            // image field
            var image = item;

            return createDefaultPDFImageBox(
                screenToPt(image.offsetLeft + image.parentElement.offsetLeft + image.parentElement.parentElement.offsetLeft + 1 - pageOrigin.left),
                screenToPt(image.offsetTop + image.parentElement.offsetTop + image.parentElement.parentElement.offsetTop + 1 - pageOrigin.top),
                screenToPt(image.clientWidth),
                screenToPt(image.clientHeight),
                image.src
            )
        }

    }), function(value){return !!value});
}

function createDefaultPDFTextBox(left,top,width,height,text,dir) {
    return {
            "left":left,
            "top":top,
            "origin":"pageTop",
            "width":width,
            "height":height,
            "stream": {
                "direction":dir,
                "items": [
                        {
                            "type" : "text",
                            "text": text,
                            "options": defaultFontOptions
                        }
                ]
            }
    };
}


var externalsCounter  = 0;
var externals = {};

function addExternal(url) {
    var name = "ex" +  (++externalsCounter);
    externals[name] = url;

    return name;
}

function createDefaultPDFImageBox(left,top,width,height,url) {
    return {
            "left":left,
            "top":top,
            "origin":"pageTop",
            "width":width,
            "height":height,
            "image": {
                    "source":addExternal(url),
                    "transformation": {
                        "fit":"always"
                    }
            }                
    };
}

function createPDF() {
    externalsCounter  = 0;
    externals = {"sourcePDF": pdfURL};

    var pdfJobTicket = {
        "title": "FilledForm.pdf",
        "meta": {
        	"deleteFileAfter":"60000"
        },
        "externals": externals,
        "document": {
            "embedded": {
                "source" : "sourcePDF",
                "pages": [
                    {
                        "modifiedFrom": 0
                    }
                ]
            }
        }
    };
    
    // text fields to boxes
    var boxes = fieldBoxesToPDFBoxes();
    if(!boxes || boxes.length == 0) {
        alert("Create some boxes to generate a new PDF")
        return;
    }

    pdfJobTicket.document.embedded.pages[0].boxes = boxes;
    console.log(JSON.stringify(pdfJobTicket,null,2));
    
    hummusService.generatePDFDocument( 
            "https://services.pdfhummus.com/api",
            "qkTpYNMelxx7oz3JV0WgC/nqfzvq+FVRJtXxj6PC3K7MvQJO0BxQi8VZQL6Ql4S+fwf3lMdzXg1L21Xzx1KSpgO8VpD2bIRESmnayPyVuaTKK+oKhw4h6BK3VZxiCDMXlI3c5dUrt9hRwFwkRGnIBzvNU7DY14Y56a5vhqq0yIE8FXT8Up1jkI7XfCjnQ6vBbROWWkDlY/so+zPSFpU4zR0mpqBcVDpHIU/ze9El9FcVMdLzVJ7QEtYEHOv4C2LstiLMwUl5X2qditrGTU0Pks2Rf4sYNOxptZHE9ARTqekmcfxbXeXuGPydP5rpDmpG1u0Qjvt91nsYF13HBXEJow==",
            pdfJobTicket,
            function(urlDownload,urlEmbed){
                $('#result-download').attr('src',urlDownload);
                alert("new PDF created successfully")
            },
            function(data){
                var statusMessage = data.statusMessage || "No communication from https://services.pdfhummus.com/api. This probably mean that the backend is down. You can still play with the project by downloading the source code. review https://github.com/galkahana/hummus-services-redux. There's also a post explaining more about the project here - https://pdfhummus.com/post/692561869326761984/pdf-as-a-service"

                console.log('had error' + statusMessage);
                alert("There was an error creating the PDF: " + statusMessage)
            });   
}


setupPreview();