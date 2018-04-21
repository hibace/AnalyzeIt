﻿using System;
using System.Configuration;
using System.Web;
using System.Web.Mvc;
using FaceIt.ServiceHelpers;
using System.Collections.ObjectModel;
using FaceIt.Models;
using System.IO;
using System.Threading.Tasks;
using Microsoft.ProjectOxford.Face;
using Microsoft.ProjectOxford.Face.Contract;
using System.Drawing;
using System.Drawing.Imaging;
using VideoFrameAnalyzer;
using OpenCvSharp;

namespace FaceIt.Controllers
{
    public class FaceController : Controller
    {
        private static string Token = ConfigurationManager.AppSettings["FaceServiceToken"];
        private static string EndPoint = ConfigurationManager.AppSettings["FaceServiceEndPoint"];


        private static string directory = "../UploadedFiles";
        private static string UplImageName = string.Empty;

        private ObservableCollection<vmFace> _detectedFaces = new ObservableCollection<vmFace>();

        private ObservableCollection<vmFace> _resultCollection = new ObservableCollection<vmFace>();

        public ObservableCollection<vmFace> DetectedFaces
        {
            get
            {
                return _detectedFaces;
            }
        }
        public ObservableCollection<vmFace> ResultCollection
        {
            get
            {
                return _resultCollection;
            }
        }
        public int MaxImageSize
        {
            get
            {
                return 450;
            }
        }



        // GET: FaceDetection
        public ActionResult Index()
        {
            return View();
        }
        
        //public async Task<CameraResult> GetFrames(VideoFrame frame)
        //{
        //    FaceServiceClient faceClient = new FaceServiceClient(Token, EndPoint);

        //    FrameGrabber<Face[]> grabber = new FrameGrabber<Face[]>();

        //    // Set up Face API call, which returns a Face[]. Simply encodes image and submits to Face API. 
        //    grabber.AnalysisFunction = async frame => return await faceClient.DetectAsync(frame.Image.ToMemoryStream(".jpg"));

        //    // Tell grabber to call the Face API every 3 seconds. 
        //    grabber.TriggerAnalysisOnInterval(TimeSpan.FromMilliseconds(3000));


        //    // Start running. 
        //    await grabber.StartProcessingCameraAsync();
        //}

        [HttpPost]
        public JsonResult SaveCandidateFiles()
        {
            string message = string.Empty, fileName = string.Empty, actualFileName = string.Empty; bool flag = false;
            //Requested File Collection
            HttpFileCollection fileRequested = System.Web.HttpContext.Current.Request.Files;
            if (fileRequested != null)
            {
                //Create New Folder
                CreateDirectory();

                //Clear Existing File in Folder
                ClearDirectory();

                for (int i = 0; i < fileRequested.Count; i++)
                {
                    var file = Request.Files[i];
                    actualFileName = file.FileName;
                    fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
                    int size = file.ContentLength;

                    try
                    {
                        file.SaveAs(Path.Combine(Server.MapPath(directory), fileName));
                        message = "File uploaded successfully";
                        UplImageName = fileName;
                        flag = true;
                    }
                    catch (Exception)
                    {
                        message = "File upload failed! Please try again";
                    }
                }
            }
            return new JsonResult
            {
                Data = new
                {
                    Message = message,
                    UplImageName = fileName,
                    Status = flag
                }
            };
        }

        [HttpGet]
        public async Task<dynamic> GetDetectedFaces()
        {
            ResultCollection.Clear();
            DetectedFaces.Clear();

            var DetectedResultsInText = string.Format("Detecting...");
            var FullImgPath = Server.MapPath(directory) + '/' + UplImageName as string;
            var QueryFaceImageUrl = directory + '/' + UplImageName;

            if (UplImageName != "")
            {
                //Create New Folder
                CreateDirectory();

                try
                {
                    // Call detection REST API
                    using (var fStream = System.IO.File.OpenRead(FullImgPath))
                    {
                        // User picked one image
                        var imageInfo = UIHelper.GetImageInfoForRendering(FullImgPath);

                        // Create Instance of Service Client by passing Servicekey as parameter in constructor 
                        var faceServiceClient = new FaceServiceClient(Token, EndPoint);

                        Face[] faces = await faceServiceClient.DetectAsync(fStream, true, true, new FaceAttributeType[] { FaceAttributeType.Gender, FaceAttributeType.Age, FaceAttributeType.Smile, FaceAttributeType.Glasses, FaceAttributeType.Emotion });

                        DetectedResultsInText = string.Format("{0} face(s) has been detected!!", faces.Length);
                        Bitmap CroppedFace = null;


                        foreach (var face in faces)
                        {
                            //Create & Save Cropped Images
                            var croppedImg = Convert.ToString(Guid.NewGuid()) + ".jpeg" as string;
                            var croppedImgPath = directory + '/' + croppedImg as string;
                            var croppedImgFullPath = Server.MapPath(directory) + '/' + croppedImg as string;
                            CroppedFace = CropBitmap(
                                            (Bitmap)Image.FromFile(FullImgPath),
                                            face.FaceRectangle.Left,
                                            face.FaceRectangle.Top,
                                            face.FaceRectangle.Width,
                                            face.FaceRectangle.Height);
                            CroppedFace.Save(croppedImgFullPath, ImageFormat.Jpeg);
                            if (CroppedFace != null)
                                ((IDisposable)CroppedFace).Dispose();


                            DetectedFaces.Add(new vmFace()
                            {
                                ImagePath = FullImgPath,
                                FileName = croppedImg,
                                FilePath = croppedImgPath,
                                Left = face.FaceRectangle.Left,
                                Top = face.FaceRectangle.Top,
                                Width = face.FaceRectangle.Width,
                                Height = face.FaceRectangle.Height,
                                FaceId = face.FaceId.ToString(),
                                Gender = face.FaceAttributes.Gender,
                                Age = string.Format("{0:#} years old", face.FaceAttributes.Age),
                                IsSmiling = face.FaceAttributes.Smile > 0.0 ? "Smile" : "Not Smile",
                                Glasses = face.FaceAttributes.Glasses.ToString(),
                                Emotion = face.FaceAttributes.Emotion.ToRankedList() //.OrderByDescending(x => x.Value).Take(1)
                            });
                        }

                        // Convert detection result into UI binding object for rendering
                        var rectFaces = UIHelper.CalculateFaceRectangleForRendering(faces, MaxImageSize, imageInfo);
                        foreach (var face in rectFaces)
                        {
                            ResultCollection.Add(face);
                        }
                    }
                }
                catch (FaceAPIException ex)
                {
                    var temp = ex.ErrorMessage;
                    var temp1 = ex.ErrorCode;
                    var temp2 = ex.HttpStatus.ToString();
                }
            }
            return new JsonResult
            {
                Data = new
                {
                    QueryFaceImage = QueryFaceImageUrl,
                    MaxImageSize = MaxImageSize,
                    FaceInfo = DetectedFaces,
                    FaceRectangles = ResultCollection,
                    DetectedResults = DetectedResultsInText
                },
                JsonRequestBehavior = JsonRequestBehavior.AllowGet
            };
        }

        public Bitmap CropBitmap(Bitmap bitmap, int cropX, int cropY, int cropWidth, int cropHeight)
        {
            Rectangle rect = new Rectangle(cropX, cropY, cropWidth, cropHeight);
            Bitmap cropped = bitmap.Clone(rect, bitmap.PixelFormat);
            return cropped;
        }

        public void CreateDirectory()
        {
            bool exists = System.IO.Directory.Exists(Server.MapPath(directory));
            if (!exists)
            {
                try
                {
                    Directory.CreateDirectory(Server.MapPath(directory));
                }
                catch (Exception ex)
                {
                    ex.ToString();
                }
            }
        }

        public void ClearDirectory()
        {
            DirectoryInfo dir = new DirectoryInfo(Path.Combine(Server.MapPath(directory)));
            var files = dir.GetFiles();
            if (files.Length > 0)
            {
                try
                {
                    foreach (FileInfo fi in dir.GetFiles())
                    {
                        GC.Collect();
                        GC.WaitForPendingFinalizers();
                        fi.Delete();
                    }
                }
                catch (Exception ex)
                {
                    ex.ToString();
                }
            }
        }
    }
}