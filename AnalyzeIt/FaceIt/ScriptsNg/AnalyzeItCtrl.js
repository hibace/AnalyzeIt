angular.module('analyzeApp', [])
    .controller('faceDetectionCtrl', function ($scope, $compile, FileUploadService) {
        
        $scope.Title = 'Microsoft FaceAPI - Face Detection';
        $scope.DetectedResultsMessage = 'No result found...';
        $scope.SelectedFileForUpload = null;
        $scope.UploadedFiles = [];
        $scope.SimilarFace = [];
        $scope.FaceRectangles = [];
        $scope.DetectedFaces = [];



        angular.forEach(angular.element("input[name='source']"), function (el) {
            angular.element(el).val(null);
        });

        
        $scope.selectCandidateFileforUpload = function (file) {

            if (file != null) {
                $scope.SelectedFileForUpload = (file.getAttribute('type') == "text") ? file.value : file.files;

                $scope.loaderMoreupl = true;
                $scope.uplMessage = 'Uploading, please wait....!';
                $scope.result = "color-red";
                
                var uploaderForFiles = "/Face/SaveCandidateFiles";
                var uploaderForImageUrl = "/Face/SaveByUrl";

                var formData = new FormData();

                var uploader = (typeof ($scope.SelectedFileForUpload) == "string") ? uploaderForImageUrl : uploaderForFiles;


                if (uploader == uploaderForImageUrl) {
                    formData.append('file', $scope.SelectedFileForUpload);
                } else {
                    angular.forEach($scope.SelectedFileForUpload, function (f, i) {
                        formData.append("file", $scope.SelectedFileForUpload[i]);
                    });
                }

                var postFile = FileUploadService.PostFile(formData, uploader);
                
                postFile.then(function (response) {
                    if (response.status == 200) {

                        var myDiv = document.querySelector('.facePreview_thumb_small');
                        myDiv.setAttribute("style", "display: none");

                        $scope.GetDetectedFaces();

                        angular.forEach(angular.element("input[name='source']"), function (inputElem) {
                            angular.element(inputElem).val(null);
                        });

                        $scope.f1.$setPristine();
                        $scope.uplMessage = response.data.Message;
                        $scope.loaderMoreupl = false;

                    }
                }, function (error) { console.warn("Error: " + error); }
                );
            }
        }
        
        $scope.snapByCam = function () {
            $('#faceCanvas_img').remove();
            $('.divRectangle_box').remove();  
            var myDiv = document.querySelector('.facePreview_thumb_small');
            myDiv.setAttribute("style", "display: none");
            var canvas = document.getElementById('canvas');
            var photo = document.getElementById('photo');

            var video = document.getElementById('video');
            var button = document.getElementById('takePhoto');
            video.setAttribute("style", "display: block");
            button.setAttribute("style", "display: block");

            var context = canvas.getContext('2d');
            var vendorUrl = window.URL || window.webkitURL;
            navigator.getMedia = navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia;

            navigator.getMedia({
                video: true,
                audio: false
            }, function (stream) {
                video.src = vendorUrl.createObjectURL(stream);
                video.play();
            }, function (error) {
                console.log(error);
            });


            function base64ToBlob(base64, mime) {
                mime = mime || '';
                var sliceSize = 1024;
                var byteChars = window.atob(base64);
                var byteArrays = [];

                for (var offset = 0, len = byteChars.length; offset < len; offset += sliceSize) {
                    var slice = byteChars.slice(offset, offset + sliceSize);

                    var byteNumbers = new Array(slice.length);
                    for (var i = 0; i < slice.length; i++) {
                        byteNumbers[i] = slice.charCodeAt(i);
                    }

                    var byteArray = new Uint8Array(byteNumbers);

                    byteArrays.push(byteArray);
                }

                return new Blob(byteArrays, { type: mime });
            }

            document.getElementById('takePhoto').addEventListener('click', function () {
                context.drawImage(video, 0, 0, 450, 337.5);
                photo.setAttribute('src', canvas.toDataURL('image/png'));

                var base64ImageContent = canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, "");
                var blob = base64ToBlob(base64ImageContent, 'image/png');
                var formData = new FormData();
                formData.append('picture', blob);

                var postFile = FileUploadService.PostFile(formData, "/Face/SaveBlob");


                postFile.then(function (response) {
                    if (response.status == 200) {

                      
                        $scope.GetDetectedFaces();
                        var video = document.getElementById('video');
                        var button = document.getElementById('takePhoto');
                        video.setAttribute("style", "display: none");
                        button.setAttribute("style", "display: none");
                       
                        
                        $scope.f1.$setPristine();
                        $scope.uplMessage = response.data.Message;
                        $scope.loaderMoreupl = false;

                    }
                }, function (error) { console.warn("Error: " + error); }
                );

            });
        }
        
        $scope.GetDetectedFaces = function () {
            $scope.loaderMore = false;
            $scope.faceMessage = 'Preparing, detecting faces, please wait....!';
            $scope.result = "color-red";

            var fileUrl = "/Face/GetDetectedFaces";
            var fileView = FileUploadService.GetUploadedFile(fileUrl);
            fileView.then(function (response) {

                $scope.QueryFace = response.data.QueryFaceImage;
                $scope.DetectedResultsMessage = response.data.DetectedResults;
                $scope.DetectedFaces = response.data.FaceInfo;
                $scope.FaceRectangles = response.data.FaceRectangles;
                $scope.loaderMore = false;

                
                $('#faceCanvas_img').remove();
                $('.divRectangle_box').remove();

             
                var canvas = document.getElementById('faceCanvas');
                
                var elemImg = document.createElement("img");
                elemImg.setAttribute("src", $scope.QueryFace);
                elemImg.setAttribute("width", response.data.MaxImageSize);
                elemImg.setAttribute("style", "border-radius: 5px");
                elemImg.id = 'faceCanvas_img';
                canvas.append(elemImg);

                angular.forEach($scope.FaceRectangles, function (imgs, i) {

                    var divRectangle = document.createElement('div');

                    var width = imgs.Width;
                    var height = imgs.Height;
                    var top = imgs.Top;
                    var left = imgs.Left;

                    divRectangle.classList.add('divRectangle_box');
                    if ($scope.DetectedFaces[i].Gender == "female")
                    {
                        divRectangle.setAttribute("style", "border: 3px solid #ba0b93");
                    }
                    divRectangle.id = 'divRectangle_' + (i + 1);

                    divRectangle.style.width = width + 'px';
                    divRectangle.style.height = height + 'px';
                    divRectangle.style.top = top + 'px';
                    divRectangle.style.left = left + 'px';

                    canvas.appendChild(divRectangle);
                    var template = '<table class="tableShow"><tr><th>Age</th><td> ' + $scope.DetectedFaces[i].Age + '</td></tr><tr><th>Gender</th><td>' + $scope.DetectedFaces[i].Gender + '</td></tr><tr><th>Smile</th><td>' + $scope.DetectedFaces[i].IsSmiling + '</td></tr><tr><th>Glasses</th><td> ' + $scope.DetectedFaces[i].Glasses + '</td></tr></table>';
                    
                    template = angular.element(template);

                    divRectangle.addEventListener("click", function () {
                        $('#someId').remove();
                        var myDiv = document.querySelector('.facePreview_thumb_small');
                        myDiv.setAttribute("style", "display: block");

                        var smallPreviewTemplate = 
                            '<div id="someId" class="card bg-light mb-3" style="width: 27rem; margin: 0 auto;"><div class="text-center" style="padding:10px"><img class="rounded" src="' +
                            $scope.DetectedFaces[i].FilePath + '"></div><div class="list-group text-center"><a class="list-group-item list-group-item-action ">' +
                            'Age: ' + $scope.DetectedFaces[i].Age + '</a><a class="list-group-item list-group-item-action ">' +
                            'Gender: ' + $scope.DetectedFaces[i].Gender + '</a><a class="list-group-item list-group-item-action ">' +
                            'IsSmiling: ' + $scope.DetectedFaces[i].IsSmiling + '</a><a class="list-group-item list-group-item-action ">' +
                            'Glasses: ' + $scope.DetectedFaces[i].Glasses + '</a></div></div>';

                        smallPreviewTemplate = angular.element(smallPreviewTemplate);
                        myDiv.append(smallPreviewTemplate[0]);
                        
                    });

                    divRectangle.append(template[0]);


                });
                

            },

                function (error) {
                    console.warn(error);
                });
        };

        $scope.hoverIn = function () {
            this.hoverEdit = true;
        };
    })

    .directive("tableshow", function ($compile) {
        return {
            restrict: 'E',
            link: function (scope, element, attr) {
                var template = '<table><tr><th>Age</th><td> {{person.Age}} </td></tr><tr><th>Gender</th><td>{{person.Gender}}</td></tr><tr><th>Smile</th><td>{{person.IsSmiling}}</td></tr><tr><th>Glasses</th><td>{{person.Glasses}}</td></tr></table>';
                var linkFn = $compile(template);
                var content = linkFn(scope);
                element.append(content);
            }
        }
    })

    .factory('FileUploadService', function ($http, $q) {
        var fact = {};

        fact.PostFile = function (formData, uploaderUrl) {

            var request = $http({
                method: "post",
                url: uploaderUrl,
                data: formData,
                withCredentials: true,
                headers: { 'Content-Type': undefined },
                transformRequest: angular.identity,
                eventHandlers: {
                    progress: function (event) {

                    }
                },
                uploadEventHandlers: {
                    progress: function (object) {

                    }
                }
            });

            return request;
        }



        fact.GetUploadedFile = function (fileUrl) {
            var request = $http({
                method: "GET",
                url: fileUrl
            });

            return request;
        }

        return fact;
    })

    .controller('emotionExplorerCtrl', function ($scope, $compile, FileUploadService) {

     
        $scope.SelectedFileForUploadEmotion = null;
        $scope.UploadedFilesEmotion = [];
        $scope.SimilarFaceEmotion = [];
        $scope.FaceRectanglesEmotion = [];
        $scope.DetectedFacesEmotion = [];
        var EmotionValues = [];

        var emotionChart = document.getElementById("emotionChart").getContext('2d');

        var myBarChart = new Chart(emotionChart, {
            type: 'horizontalBar',
            data: {
                labels: ["Anger", "Contempt", "Disgust", "Fear", "Happiness", "Neutral", "Sadness", "Surprise"],
                datasets: [
                    {
                        label: "Value",
                        backgroundColor: ["#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9", "#c45850", "#778899", "#CD853F", "#BA55D3"],
                        data: []
                    }
                ]
            },
            options: {
                events: ['mousemove'],
                responsive: false,
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Values of emotion explorer'
                }
            }
        });

        angular.forEach(angular.element("input[name='source']"), function (el) {
            angular.element(el).val(null);
        });
       
        $scope.selectCandidateFileforUploadEmotion = function (file) {

            var video = document.getElementById('videoEm');
            var button = document.getElementById('takePhotoEm');
            video.setAttribute("style", "display: none");
            button.setAttribute("style", "display: none");
            EmotionValues = [];
            myBarChart.config.data.datasets[0].data = EmotionValues;
            myBarChart.update();

            if (file != null) {

                $scope.SelectedFileForUploadEmotion = (file.getAttribute('type') == "text") ? file.value : file.files;


                //Save File
                var uploaderForFiles = "/Face/SaveCandidateFiles";
                var uploaderForImageUrl = "/Face/SaveByUrl";

                var formData = new FormData();

                var uploader = (typeof ($scope.SelectedFileForUploadEmotion) == "string") ? uploaderForImageUrl : uploaderForFiles;


                if (uploader == uploaderForImageUrl) {
                    formData.append('file', $scope.SelectedFileForUploadEmotion);
                } else {
                    angular.forEach($scope.SelectedFileForUploadEmotion, function (f, i) {
                        formData.append("file", $scope.SelectedFileForUploadEmotion[i]);
                    });
                }

                var postFile = FileUploadService.PostFile(formData, uploader);


                postFile.then(function (response) {
                    if (response.status == 200) {


                        $scope.GetDetectedEmotions();


                        angular.forEach(angular.element("input[name='source']"), function (inputElem) {
                            angular.element(inputElem).val(null);
                        });

                        $scope.f1.$setPristine();


                    }
                }, function (error) { console.warn("Error: " + error); }
                );
            }
        }

        $scope.snapByCamEm = function () {
            EmotionValues = [];
            myBarChart.config.data.datasets[0].data = EmotionValues;
            myBarChart.update();
            $('#faceCanvasEmotion_img').remove();
            $('.divRectangle_box').remove();
            var canvas = document.getElementById('canvasEm');
            var photo = document.getElementById('photoEm');

            var video = document.getElementById('videoEm');
            var button = document.getElementById('takePhotoEm');
            video.setAttribute("style", "display: block");
            button.setAttribute("style", "display: block");

            var context = canvas.getContext('2d');
            var vendorUrl = window.URL || window.webkitURL;
            navigator.getMedia = navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia;

            navigator.getMedia({
                video: true,
                audio: false
            }, function (stream) {
                video.src = vendorUrl.createObjectURL(stream);
                video.play();
            }, function (error) {
                console.log(error);
            });

            function base64ToBlob(base64, mime) {
                mime = mime || '';
                var sliceSize = 1024;
                var byteChars = window.atob(base64);
                var byteArrays = [];

                for (var offset = 0, len = byteChars.length; offset < len; offset += sliceSize) {
                    var slice = byteChars.slice(offset, offset + sliceSize);

                    var byteNumbers = new Array(slice.length);
                    for (var i = 0; i < slice.length; i++) {
                        byteNumbers[i] = slice.charCodeAt(i);
                    }

                    var byteArray = new Uint8Array(byteNumbers);

                    byteArrays.push(byteArray);
                }

                return new Blob(byteArrays, { type: mime });
            }

            document.getElementById('takePhotoEm').addEventListener('click', function () {
                context.drawImage(video, 0, 0, 450, 337.5);
                photo.setAttribute('src', canvas.toDataURL('image/png'));

                var base64ImageContent = canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, "");
                var blob = base64ToBlob(base64ImageContent, 'image/png');
                var formData = new FormData();
                formData.append('picture', blob);

                var postFile = FileUploadService.PostFile(formData, "/Face/SaveBlob");


                postFile.then(function (response) {
                    if (response.status == 200) {


                        $scope.GetDetectedEmotions();
                        var video = document.getElementById('videoEm');
                        var button = document.getElementById('takePhotoEm');
                        video.setAttribute("style", "display: none");
                        button.setAttribute("style", "display: none");



                    }
                }, function (error) { console.warn(error); }
                );

            });
        }
        
        $scope.GetDetectedEmotions = function () {


            var fileUrl = "/Face/GetDetectedFaces";
            var fileView = FileUploadService.GetUploadedFile(fileUrl);
            fileView.then(function (response) {

                $scope.QueryFaceEmotion = response.data.QueryFaceImage;
                $scope.DetectedResultsMessageEmotion = response.data.DetectedResults;
                $scope.DetectedFacesEmotion = response.data.FaceInfo;
                $scope.FaceRectanglesEmotion = response.data.FaceRectangles;
                
                $('#faceCanvasEmotion_img').remove();
                $('.divRectangle_box').remove();
                
                var canvas = document.getElementById('faceCanvasEmotion');
                
                var elemImg = document.createElement("img");
                elemImg.setAttribute("src", $scope.QueryFaceEmotion);
                elemImg.setAttribute("width", response.data.MaxImageSize);
                elemImg.setAttribute("style", "border-radius: 5px");
                elemImg.id = 'faceCanvasEmotion_img';
                canvas.append(elemImg);

                angular.forEach($scope.FaceRectanglesEmotion, function (imgs, i) {

                    var divRectangle = document.createElement('div');

                    var width = imgs.Width;
                    var height = imgs.Height;
                    var top = imgs.Top;
                    var left = imgs.Left;

                    divRectangle.classList.add('divRectangle_box');
                    if ($scope.DetectedFacesEmotion[i].Gender == "female") {
                        divRectangle.setAttribute("style", "border: 3px solid #ba0b93");
                    }

                    divRectangle.classList.add('divRectangle_box');
                    divRectangle.id = 'divRectangle_' + (i + 1);

                    divRectangle.style.width = width + 'px';
                    divRectangle.style.height = height + 'px';
                    divRectangle.style.top = top + 'px';
                    divRectangle.style.left = left + 'px';
                   
                    var template = '<table class="tableShow"><tr><th>Anger</th><td> ' + $scope.DetectedFacesEmotion[i].Emotion.Anger +
                        '</td></tr><tr><th>Contempt</th><td>' + $scope.DetectedFacesEmotion[i].Emotion.Contempt +
                        '</td></tr><tr><th>Disgust</th><td>' + $scope.DetectedFacesEmotion[i].Emotion.Disgust +
                        '</td></tr><tr><th>Fear</th><td> ' + $scope.DetectedFacesEmotion[i].Emotion.Fear +
                        '</td></tr><tr><th>Happiness</th><td>' + $scope.DetectedFacesEmotion[i].Emotion.Happiness +
                        '</td></tr><tr><th>Neutral</th><td>' + $scope.DetectedFacesEmotion[i].Emotion.Neutral +
                        '</td></tr><tr><th>Sadness</th><td>' + $scope.DetectedFacesEmotion[i].Emotion.Sadness +
                        '</td></tr><tr><th>Surprise</th><td>' + $scope.DetectedFacesEmotion[i].Emotion.Surprise +
                        '</td></tr></table>';

                    template = angular.element(template);
                    
                    divRectangle.addEventListener('click', function () {
                        EmotionValues = $scope.DetectedFacesEmotion[i].Emotion;
                        myBarChart.config.data.datasets[0].data = [EmotionValues.Anger, EmotionValues.Contempt, EmotionValues.Disgust, EmotionValues.Fear, EmotionValues.Happiness, EmotionValues.Neutral, EmotionValues.Sadness, EmotionValues.Surprise];
                        myBarChart.update();
                    });

                    divRectangle.append(template[0]);
                    canvas.appendChild(divRectangle);

                });

            },

                function (error) {
                    console.warn(error);
                });
        };

        $scope.hoverIn = function () {
            this.hoverEdit = true;
        };
    })


    .controller('imageAnalyzerExplorerCtrl', function ($scope, $compile, FileUploadService) {
        $scope.SelectedFileForUploadimageAnalyze = null;
        $scope.UploadedFilesimageAnalyze = [];
        $scope.SimilarFaceimageAnalyze = [];
        $scope.FaceRectanglesimageAnalyze = [];
        $scope.DetectedFacesimageAnalyze = [];

        angular.forEach(angular.element("input[name='source']"), function (el) {
            angular.element(el).val(null);
        });
        
        $scope.selectCandidateFileforUploadimageAnalyze = function (file) {

            if (file != null) {

                $scope.SelectedFileForUploadimageAnalyze = (file.getAttribute('type') == "text") ? file.value : file.files;


                //Save File
                var uploaderForFiles = "/Face/SaveCandidateFiles";
                var uploaderForImageUrl = "/Face/SaveByUrl";

                var formData = new FormData();

                var uploader = (typeof ($scope.SelectedFileForUploadimageAnalyze) == "string") ? uploaderForImageUrl : uploaderForFiles;


                if (uploader == uploaderForImageUrl) {
                    formData.append('file', $scope.SelectedFileForUploadimageAnalyze);
                } else {
                    angular.forEach($scope.SelectedFileForUploadimageAnalyze, function (f, i) {
                        formData.append("file", $scope.SelectedFileForUploadimageAnalyze[i]);
                    });
                }

                var postFile = FileUploadService.PostFile(formData, uploader);


                postFile.then(function (response) {
                    if (response.status == 200) {


                        $scope.GetDetectedimageAnalyze();


                        angular.forEach(angular.element("input[name='source']"), function (inputElem) {
                            angular.element(inputElem).val(null);
                        });

                        $scope.f1.$setPristine();


                    }
                }, function (error) { console.warn("Error: " + error); }
                );
            }
        }

        $scope.snapByCamAnalyzer = function () {
            $('#faceCanvasimageAnalyze_img').remove();
            $('.divRectangle_box').remove();
            var canvas = document.getElementById('canvasIa');
            var photo = document.getElementById('photoIa');

            var video = document.getElementById('videoIa');
            var button = document.getElementById('takePhotoIa');
            video.setAttribute("style", "display: block");
            button.setAttribute("style", "display: block");

            var context = canvas.getContext('2d');
            var vendorUrl = window.URL || window.webkitURL;
            navigator.getMedia = navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia;

            navigator.getMedia({
                video: true,
                audio: false
            }, function (stream) {
                video.src = vendorUrl.createObjectURL(stream);
                video.play();
            }, function (error) {
                console.log(error);
            });

            function base64ToBlob(base64, mime) {
                mime = mime || '';
                var sliceSize = 1024;
                var byteChars = window.atob(base64);
                var byteArrays = [];

                for (var offset = 0, len = byteChars.length; offset < len; offset += sliceSize) {
                    var slice = byteChars.slice(offset, offset + sliceSize);

                    var byteNumbers = new Array(slice.length);
                    for (var i = 0; i < slice.length; i++) {
                        byteNumbers[i] = slice.charCodeAt(i);
                    }

                    var byteArray = new Uint8Array(byteNumbers);

                    byteArrays.push(byteArray);
                }

                return new Blob(byteArrays, { type: mime });
            }

            document.getElementById('takePhotoIa').addEventListener('click', function () {
                context.drawImage(video, 0, 0, 450, 337.5);
                photo.setAttribute('src', canvas.toDataURL('image/png'));

                var base64ImageContent = canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, "");
                var blob = base64ToBlob(base64ImageContent, 'image/png');
                var formData = new FormData();
                formData.append('picture', blob);

                var postFile = FileUploadService.PostFile(formData, "/Face/SaveBlob");


                postFile.then(function (response) {
                    if (response.status == 200) {


                        $scope.GetDetectedimageAnalyze();
                        var video = document.getElementById('videoIa');
                        var button = document.getElementById('takePhotoIa');
                        video.setAttribute("style", "display: none");
                        button.setAttribute("style", "display: none");



                    }
                }, function (error) { console.warn("Error: " + error); }
                );

            });
        }
        
        $scope.GetDetectedimageAnalyze = function () {
            var fileUrl = "/Face/GetImageAnalyzation";
            var fileView = FileUploadService.GetUploadedFile(fileUrl);
            fileView.then(function (response) {

                $scope.QueryFaceimageAnalyze = response.data.QueryFaceImage;
                $scope.DetectedResultsMessageimageAnalyze = response.data.DetectedResults;
                $scope.DetectedFacesimageAnalyze = response.data.FaceInfo;
                $scope.FaceRectanglesimageAnalyze = response.data.FaceRectangles;

                var JsonResponse = JSON.parse(response.data.ResponseString);
                

                $scope.ImageInfo = {
                    description : JsonResponse.description.captions[0].text,
                    tags : JsonResponse.description.tags,
                    format : '"' + JsonResponse.metadata.format + '"',
                    imageSize : JsonResponse.metadata.width + " x " + JsonResponse.metadata.height,
                    accentColor: "#" + JsonResponse.color.accentColor
                }
                
                console.log($scope.JsonResponse);
                
                $('#faceCanvasimageAnalyze_img').remove();
                $('.divRectangle_box').remove();
                
                var canvas = document.getElementById('faceCanvasimageAnalyze');
                
                var elemImg = document.createElement("img");
                elemImg.setAttribute("src", $scope.QueryFaceimageAnalyze);
                elemImg.setAttribute("width", response.data.MaxImageSize);
                elemImg.setAttribute("style", "border-radius: 5px");
                elemImg.id = 'faceCanvasimageAnalyze_img';
                canvas.append(elemImg);
                var tImAnalyze = document.getElementById('tImAn');
                tImAnalyze.setAttribute("style", "visibility: visible");

                var accentColorDiv = document.getElementById("accentColor");
                accentColorDiv.setAttribute("style", "background-color: " + $scope.ImageInfo.accentColor);
                
            },

                function (error) {
                    console.warn("Error: " + error);
                });
        };

        $scope.hoverIn = function () {
            this.hoverEdit = true;
        };
    })