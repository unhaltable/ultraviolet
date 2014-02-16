require.config({
    baseUrl: 'scripts'
});

define(['jquery'], function() {
    return {
        dataURItoBlob: function(dataURI) {
            // Convert base64 to raw binary data held in a string
            // doesn't handle URLEncoded DataURIs
            var byteString;
            if (dataURI.split(',')[0].indexOf('base64') >= 0)
                byteString = atob(dataURI.split(',')[1]);
            else
                byteString = unescape(dataURI.split(',')[1]);

            // Separate out the mime component
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

            // Write the bytes of the string to an ArrayBuffer
            var ab = new ArrayBuffer(byteString.length);
            var ia = new Uint8Array(ab);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            // Passing an ArrayBuffer to the Blob constructor appears to be deprecated,
            // so convert ArrayBuffer to DataView
            var dataView = new DataView(ab);
            var blob = new Blob([dataView], {type: mimeString});

            return blob;
        }
    };
});