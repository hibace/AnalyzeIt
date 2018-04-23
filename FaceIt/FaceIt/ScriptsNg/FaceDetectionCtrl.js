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
        

        //File Select & Save 
        $scope.selectCandidateFileforUpload = function (file) {
            
            if (file != null) {

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
                elemImg.id = 'faceCanvas_img';
                canvas.append(elemImg);



                angular.forEach($scope.FaceRectangles, function (imgs, i) {
                    
                    var divRectangle = document.createElement('div');
                    var arrow = document.createElement('div');
                    arrow.classList.add('arrow');

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
                    
                    canvas.append(divRectangle);
                    divRectangle.append(arrow);
                    var temp = ($compile)('<table-show></table-show>')($scope);
                   
                    divRectangle.append(temp[0]);

                    $scope.person = {
                        Age: $scope.DetectedFaces[i].Age,
                        Gender: $scope.DetectedFaces[i].Gender,
                        Smile: $scope.DetectedFaces[i].IsSmiling
                    };
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

.directive("tableShow", function () {
    return {
        template: "<table class='fTableinfo'><tr><th>Age</th><td> {{person.Age}} </td></tr><tr><th>Gender</th><td>{{person.Gender}}</td></tr><tr><th>Smile</th><td>{{person.Smile}}</td></tr></table>"
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