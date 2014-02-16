require.config({
    baseUrl: 'scripts',
    "shim": {
        "filereader": ["jquery"],
        "hotkeys": ["jquery"]
    }
});

require(['jquery', 'steganography', 'hotkeys', 'filereader', 'state-machine', 'util'], function (jq, st, hk, fr, sm, util) {

    var loadedFile;

    var fsm = sm.create({
        initial: 'dropzone',
        events: [
            { name: 'load', from: 'dropzone', to: 'concealed' },
            { name: 'save',  from: ['revealed', 'concealed'], to: 'dropzone'},
            { name: 'close',  from: ['revealed', 'concealed'], to: 'dropzone'},
            { name: 'conceal', from: ['revealed', 'concealed'], to: 'concealed' },
            { name: 'reveal', from: 'concealed', to: 'revealed'}
        ],
        callbacks: {
            onload: function(event, from, to, dataUri, file) {
                // Load image data URI
                $("#image").attr("src", dataUri);
                // Save file name
                loadedFile = file;

                animateLoadImage().then(function () {
                    fsm.reveal(getMessage());
                });
            },
            onsave: function(event, from, to) {
                
            },
            onleavestate: function(event, from, to) {
                if (event == 'save') {
                    animateConcealMessage().then(function () {
                        return saveImage();
                    }).then(function () {
                        // Go back to the main screen
                        animateCloseImage().then(function () {
                            fsm.transition();
                        });
                    }, function () {
                        // Cancel the event
                        fsm.transition.cancel();
                    });
                    return sm.ASYNC;
                }
            },
            onclose: function(event, from, to) {
                animateCloseImage();
            },
            onconceal: function(event, from, to) {
                if (from == 'revealed') {
                    var image = $("#image")[0];
                    image.src = steg.encode($("#text").val(), image, {
                        width: image.naturalWidth,
                        height: image.naturalHeight
                    });
                }
                fsm.save();

                // Unbind keyboard shortcut
                $(document).unbind('keyup', 'Ctrl+s', saveImage);
            },
            onreveal: function(event, from, to, message) {
                // Load message
                $("#text").val(message);
                // Show message
                animateRevealMessage();
            }
        }
    });

    function saveImage() {
        return new Promise(function (resolve, reject) {
            // Save the image once the animation completes
            var blob = util.dataURItoBlob($("#image").attr("src"));
            chrome.fileSystem.chooseEntry({
                type: 'saveFile',
                suggestedName: loadedFile.name,
                accepts: [{ mimeTypes: [loadedFile.type] }]
            }, function (writableFileEntry) {
                function errorHandler (e) {
                    console.log("Error writing file: " + e);
                }
                if (writableFileEntry) {
                    writableFileEntry.createWriter(function (writer) {
                        writer.onerror = errorHandler;
                        writer.onabort = function (e) {
                            // Save was canceled; reject promise
                            reject(e);
                        };
                        writer.onwriteend = function (e) {
                            // Save successful; resolve promise
                            resolve(e);
                        };
                        writer.write(blob);
                    }, errorHandler);
                } else {
                    reject();
                }
            });
        });
    };

    function getMessage() {
        var image = $("#image")[0];
        return steg.decode(image, {
            width: image.naturalWidth,
            height: image.naturalHeight
        });
    }

    function animateLoadImage() {
        return new Promise(function (resolve, reject) {
            $.when(
                $("#dropzone").hide().promise(),
                $("#close").show().promise(),
                $("#save").show().promise(),
                $("#about").removeClass("about_bg").promise(),
                $("#buttons").css("bottom", "0").promise(),
                $("#image").show().promise(),
                $("#image").css("top", "0").promise(),
                $(document).bind('keyup', 'Ctrl+s', saveImage).promise()
            ).done(function () {
                resolve();
            })
        });
    }

    function animateCloseImage() {
        return new Promise(function (resolve, reject) {
            $.when(
                $("#text").val("").promise(),
                $("#dropzone").show().promise(),
                $("#text").hide().promise(),
                $("#close").hide().promise(),
                $("#save").hide().promise(),
                $("#about").addClass("about_bg").promise(),
                $("#buttons").css("bottom", "-90px").promise(),
                $("#darken").css("opacity", "0").promise(),
                $("#image").css("top", "105%").one("webkitTransitionEnd", function (e) {
                    $("#image").hide();
                    $("#image").css("top", "");
                }),
                $("#image").css("-webkit-filter", "blur(0)").promise(),
                $(document).unbind('keyup', 'Ctrl+s', saveImage).promise()
            ).done(function () {
                resolve();
            })
        });
    }

    function animateConcealMessage() {
        return new Promise(function (resolve, reject) {
            // Transition the image up
            var $image = $("#image");
            $image.css("top", -$image.height()).one("webkitTransitionEnd", function (e) {
                // Bring the image forward
                $(this).css("z-index", 1);

                // Remove the blur
                $(this).css("-webkit-filter", "blur(0)");
                
                // Transition the image down
                $(this).css("top", 0).one("webkitTransitionEnd", function (e) {
                    resolve();
                });
            });
        });
    }

    function animateRevealMessage() {
        return new Promise(function (resolve, reject) {
            // Bring the image forward
            $("#image").css("z-index", 1);

            // Show text (behind image)
            $("#text").show();
            $("#darken").css("opacity", 1);

            // Move image up
            var $image = $("#image");
            $image.css("top", -$image.height()).one("webkitTransitionEnd", function (e) {
                // Add the blur
                $(this).css("-webkit-filter", "blur(5px)");

                // Push the image backward
                $(this).css("z-index", -2);

                // Transition the image down
                $(this).css("top", 0).one("webkitTransitionEnd", function (e) {
                    resolve();
                });
            });
        });
    }

    // Activate dropzone
    $("#file, #dropzone").fileReaderJS({
        dragClass: "drag",
        accept: 'image/*',
        readAsDefault: 'DataURL',
        on: {
            load: function(e, file) {
                fsm.load(e.target.result, file);
            },
            error: function(e, file) {
                console.log("Error loading file");
            }
        }
    });

    // Handle 'hide' button
    $("#buttons-hide").click(function (e) {
        fsm.conceal();
    });

    // Handle close (X) button
    $("#close").click(function () {
        fsm.close();
    });

    // Handle 'save' button
    $("#save").click(function () {
        fsm.save();
    });

    // Handle 'about' button
    $("#about").click(function () {
        chrome.app.window.create("options/options.html", { "minHeight": 614 });
    });

    // Handle drop zone click
    $("#dropzone").click(function () {
        $("#file").click();
    });

    // Fix for not being able to open the same file more than once in a row
    $(document).on("click", "#file", function () {
        this.value = null;
    });

});
