angular.module('analyzeApp', [])
    .controller('faceDetectionCtrl', function ($scope, $compile, FileUploadService) {
        
        $scope.Title = 'Microsoft FaceAPI - Face Detection';
        $scope.DetectedResultsMessage = 'No result found...';
        $scope.SelectedFileForUpload = null;
        $scope.UploadedFiles = [];
        $scope.SimilarFace = [];
        $scope.FaceRectangles = [];
        $scope.DetectedFaces = [];
        $scope.person = {
            Age: "30",
            Gender: "female",
            IsSmiling: "no"
        };

        //var tempImageUrl = "https://trackingjs.com/bower/tracking.js/examples/assets/faces.jpg";
        //var testUploader = "/Face/SaveByUrl";

        //var formData = new FormData();

        //formData.append('file', tempImageUrl);

        //var postTest = FileUploadService.PostFile(formData, testUploader);


        //postTest.then(function (response) {
        //    if (response.status == 200) {


        //        $scope.GetDetectedFaces();

        //    }
        //}, function (error) { console.warn("Error: " + error); }
        //);


        angular.forEach(angular.element("input[name='source']"), function (el) {
            angular.element(el).val(null);
        });


        //File Select & Save 
        $scope.selectCandidateFileforUpload = function (file) {

            if (file != null) {
                console.log(file);
                $scope.SelectedFileForUpload = (file.getAttribute('type') == "text") ? file.value : file.files;

                $scope.loaderMoreupl = true;
                $scope.uplMessage = 'Uploading, please wait....!';
                $scope.result = "color-red";

                //Save File
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

        //Get Detected Faces
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




                //Reset element
                $('#faceCanvas_img').remove();
                $('.divRectangle_box').remove();

                //get element byID
                var canvas = document.getElementById('faceCanvas');

                //add image element
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
                    divRectangle.id = 'divRectangle_' + (i + 1);

                    divRectangle.style.width = width + 'px';
                    divRectangle.style.height = height + 'px';
                    divRectangle.style.top = top + 'px';
                    divRectangle.style.left = left + 'px';

                    canvas.appendChild(divRectangle);
                    if ($scope.DetectedFaces.length < 2) {
                        angular.forEach($scope.DetectedFaces, function (f, i) {
                            $scope.person = {
                                Age: $scope.DetectedFaces[i].Age,
                                Gender: $scope.DetectedFaces[i].Gender,
                                IsSmiling: $scope.DetectedFaces[i].IsSmiling,
                                Glasses: $scope.DetectedFaces[i].Glasses
                            }
                        });
                        var tableShow = ($compile)(angular.element('<tableshow class="tableShow"></tableshow>'))($scope);
                        var arrow = document.createElement('div');
                        arrow.classList.add('arrow');
                        divRectangle.append(arrow);
                        divRectangle.append(tableShow[0]);
                    }
                });

            },

                function (error) {
                    console.warn("Error: " + error);
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


        //var tempImageUrl = "https://trackingjs.com/bower/tracking.js/examples/assets/faces.jpg";
        //var testUploader = "/Face/SaveByUrl";

        //var formData = new FormData();

        //formData.append('file', tempImageUrl);

        //var postTest = FileUploadService.PostFile(formData, testUploader);


        //postTest.then(function (response) {
        //    if (response.status == 200) {


        //        $scope.GetDetectedEmotions();

        //    }
        //}, function (error) { console.warn("Error: " + error); }
        //);

        angular.forEach(angular.element("input[name='source']"), function (el) {
            angular.element(el).val(null);
        });


        //File Select & Save 
        $scope.selectCandidateFileforUploadEmotion = function (file) {

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

        //Get Detected Faces
        $scope.GetDetectedEmotions = function () {


            var fileUrl = "/Face/GetDetectedFaces";
            var fileView = FileUploadService.GetUploadedFile(fileUrl);
            fileView.then(function (response) {

                $scope.QueryFaceEmotion = response.data.QueryFaceImage;
                $scope.DetectedResultsMessageEmotion = response.data.DetectedResults;
                $scope.DetectedFacesEmotion = response.data.FaceInfo;
                $scope.FaceRectanglesEmotion = response.data.FaceRectangles;

                //Reset element
                $('#faceCanvasEmotion_img').remove();
                $('.divRectangle_box').remove();

                //get element byID
                var canvas = document.getElementById('faceCanvasEmotion');

                //add image element
                var elemImg = document.createElement("img");
                elemImg.setAttribute("src", $scope.QueryFaceEmotion);
                elemImg.setAttribute("width", response.data.MaxImageSize);
                elemImg.setAttribute("style", "border-radius: 5px");
                elemImg.id = 'faceCanvasEmotion_img';
                canvas.append(elemImg);

                var emValues = null;

              
                angular.forEach($scope.DetectedFacesEmotion, function (f, i) {
                    emValues = $scope.DetectedFacesEmotion[i].Emotion;
                });
                

                var emotionChart = document.getElementById("emotionChart");
                var myBarChart = new Chart(emotionChart, {
                    type: 'horizontalBar',
                    data: {
                        labels: [emValues[0].Key, emValues[1].Key, emValues[2].Key, emValues[3].Key, emValues[4].Key, emValues[5].Key, emValues[6].Key, emValues[7].Key],
                        datasets: [
                            {
                                label: "Value",
                                backgroundColor: ["#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9", "#c45850"],
                                data: [emValues[0].Value, emValues[1].Value, emValues[2].Value, emValues[3].Value, emValues[4].Value, emValues[5].Value, emValues[6].Value, emValues[7].Value]
                            }
                        ]
                    },
                    options: {

                        responsive: false,
                        legend: { display: false },
                        title: {
                            display: true,
                            text: 'Values of emotion explorer'
                        }
                    }
                });



                angular.forEach($scope.FaceRectanglesEmotion, function (imgs, i) {

                    var divRectangle = document.createElement('div');

                    var width = imgs.Width;
                    var height = imgs.Height;
                    var top = imgs.Top;
                    var left = imgs.Left;

                    divRectangle.classList.add('divRectangle_box');
                    divRectangle.id = 'divRectangle_' + (i + 1);

                    divRectangle.style.width = width + 'px';
                    divRectangle.style.height = height + 'px';
                    divRectangle.style.top = top + 'px';
                    divRectangle.style.left = left + 'px';

                    divRectangle.addEventListener("click", function () {
                        angular.forEach($scope.DetectedFacesEmotion, function (f, i) {
                            
                            console.log("hui");
                            console.log(emoData);
                            console.log(emoValues);
                        });
                    });

                    canvas.appendChild(divRectangle);

                });

            },

                function (error) {
                    console.warn("Error: " + error);
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


        //var tempImageUrl = "https://trackingjs.com/bower/tracking.js/examples/assets/faces.jpg";
        //var testUploader = "/Face/SaveByUrl";

        //var formData = new FormData();

        //formData.append('file', tempImageUrl);

        //var postTest = FileUploadService.PostFile(formData, testUploader);


        //postTest.then(function (response) {
        //    if (response.status == 200) {


        //        $scope.GetDetectedimageAnalyze();

        //    }
        //}, function (error) { console.warn("Error: " + error); }
        //);

        angular.forEach(angular.element("input[name='source']"), function (el) {
            angular.element(el).val(null);
        });


        //File Select & Save 
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

        //Get Detected Faces
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

                //Reset element
                $('#faceCanvasimageAnalyze_img').remove();
                $('.divRectangle_box').remove();

                //get element byID
                var canvas = document.getElementById('faceCanvasimageAnalyze');

                //add image element
                var elemImg = document.createElement("img");
                elemImg.setAttribute("src", $scope.QueryFaceimageAnalyze);
                elemImg.setAttribute("width", response.data.MaxImageSize);
                elemImg.setAttribute("style", "border-radius: 5px");
                elemImg.id = 'faceCanvasimageAnalyze_img';
                canvas.append(elemImg);
                var tImAnalyze = document.getElementById('tImAn');
                tImAnalyze.setAttribute("style", "visibility: visible");

                var accentColorDiv = document.getElementById("accentColor");
               // var dfColor = document.getElementById("dominantForColor");
                // var dbColor = document.getElementById("dominantBackColor");
                accentColorDiv.setAttribute("style", "background-color: " + $scope.ImageInfo.accentColor);
                //dfColor.setAttribute("style", "background-color: #" + $scope.JsonResponse.color.dominantColorForeground);
                //dbColor.setAttribute("style", "background-color: #" + $scope.JsonResponse.color.dominantColorBackground);
                
            },

                function (error) {
                    console.warn("Error: " + error);
                });
        };

        $scope.hoverIn = function () {
            this.hoverEdit = true;
        };
    })