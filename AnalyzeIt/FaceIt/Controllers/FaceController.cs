using System;
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
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;

namespace FaceIt.Controllers
{
    public class FaceController : Controller
    {
        private static string Token = ConfigurationManager.AppSettings["FaceServiceToken"];
        private static string EndPoint = ConfigurationManager.AppSettings["FaceServiceEndPoint"];

        private static string ImageAnalyzerToken = ConfigurationManager.AppSettings["VisionServiceToken"];
        private static string ImageAnalyzerEndPoint = ConfigurationManager.AppSettings["VisionServiceEndPoint"];

        private static string directory = "../UploadedFiles";
        private static string UplImageName = string.Empty;

        private ObservableCollection<AIFace> _detectedFaces = new ObservableCollection<AIFace>();

        private ObservableCollection<AIFace> _resultCollection = new ObservableCollection<AIFace>();

        public ObservableCollection<AIFace> DetectedFaces
        {
            get
            {
                return _detectedFaces;
            }
        }
        public ObservableCollection<AIFace> ResultCollection
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

        public ActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public JsonResult SaveByUrl()
        {
            string message = string.Empty, fileName = string.Empty, actualFileName = string.Empty; bool flag = false;
          
            var request = System.Web.HttpContext.Current.Request.Form;
           
            
            if (request != null || request.Count != 0)
            {
                CreateDirectory();
                
                ClearDirectory();
                
                for (int i = 0; i < request.Count; i++)
                {
                    var imageUrl = request["file"];
                    
                    try
                    {
                        var webRequest = (System.Net.HttpWebRequest)System.Net.HttpWebRequest.Create(imageUrl);
                        webRequest.AllowWriteStreamBuffering = true;
                        webRequest.Timeout = 30000;

                        var webResponse = webRequest.GetResponse();

                        var stream = webResponse.GetResponseStream();

                        var image = System.Drawing.Image.FromStream(stream);
                        fileName = Guid.NewGuid() + Path.GetExtension(imageUrl);
                        image.Save(Path.Combine(Server.MapPath(directory), fileName));
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

        [HttpPost]
        public JsonResult SaveCandidateFiles()
        {
            string message = string.Empty, fileName = string.Empty, actualFileName = string.Empty; bool flag = false;
            
            HttpFileCollection fileRequested = System.Web.HttpContext.Current.Request.Files;
            if (fileRequested != null)
            {
                CreateDirectory();
                
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

        [HttpPost]
        public JsonResult SaveBlob()
        {
            string message = string.Empty, fileName = string.Empty, actualFileName = string.Empty; bool flag = false;
           
            HttpFileCollection fileRequested = System.Web.HttpContext.Current.Request.Files;
            if (fileRequested != null)
            {
                CreateDirectory();
                ClearDirectory();

                for (int i = 0; i < fileRequested.Count; i++)
                {
                    var file = Request.Files[i];
                    actualFileName = file.FileName;
                    fileName = Guid.NewGuid() + Path.GetExtension(file.FileName) + ".jpg";
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
                CreateDirectory();

                try
                {
                    using (var fStream = System.IO.File.OpenRead(FullImgPath))
                    {
                        Bitmap img = new Bitmap(FullImgPath);

                        var imageInfo = new Tuple<int, int>(img.Width, img.Height);//UIHelper.GetImageInfoForRendering(FullImgPath);
                        
                        var faceServiceClient = new FaceServiceClient(Token, EndPoint);

                        Face[] faces = await faceServiceClient.DetectAsync(fStream, true, true, new FaceAttributeType[] { FaceAttributeType.Gender, FaceAttributeType.Age, FaceAttributeType.Smile, FaceAttributeType.Glasses, FaceAttributeType.Emotion });

                        DetectedResultsInText = string.Format("{0} face(s) has been detected!!", faces.Length);
                        Bitmap CroppedFace = null;


                        foreach (var face in faces)
                        {
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


                            DetectedFaces.Add(new AIFace()
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
                                Age = string.Format("{0:#} y. o.", face.FaceAttributes.Age),
                                IsSmiling = face.FaceAttributes.Smile > 0.0 ? "Smile" : "Not Smile",
                                Glasses = face.FaceAttributes.Glasses.ToString(),
                                Emotion = face.FaceAttributes.Emotion
                            });
                        }
                        
                        var rectFaces = UIHelper.CalculateFaceRectangleForRendering(faces, MaxImageSize, imageInfo);
                        foreach (var face in rectFaces)
                        {
                            ResultCollection.Add(face);
                        }
                    }
                }
                catch (FaceAPIException ex)
                {
                    return ex;
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

        static byte[] GetImageAsByteArray(string imageFilePath)
        {
            FileStream fileStream = new FileStream(imageFilePath, FileMode.Open, FileAccess.Read);
            BinaryReader binaryReader = new BinaryReader(fileStream);
            return binaryReader.ReadBytes((int)fileStream.Length);
        }

        [HttpGet]
        public async Task<dynamic> GetImageAnalyzation()
        {
            ResultCollection.Clear();
            DetectedFaces.Clear();
            string responseString = "";


            var FullImgPath = Server.MapPath(directory) + '/' + UplImageName as string;
            var QueryFaceImageUrl = directory + '/' + UplImageName;

            if (UplImageName != "")
            {
                CreateDirectory();

                try
                {

                    HttpClient client = new HttpClient();
                    client.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", ImageAnalyzerToken);
                    string requestParameters = "visualFeatures=Categories,Tags,Description,Color&language=en";
                    string uri = ImageAnalyzerEndPoint + "?" + requestParameters;

                    byte[] byteData = GetImageAsByteArray(FullImgPath);

                    using (ByteArrayContent content = new ByteArrayContent(byteData))
                    {
                        
                        content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");

                        var response = await client.PostAsync(uri, content);

                        responseString = await response.Content.ReadAsStringAsync();
                        
                    }
                }
                catch (HttpException ex)
                {
                    var MessageError = ex.ToString();
                }
            }
            return new JsonResult
            {
                Data = new
                {
                    QueryFaceImage = QueryFaceImageUrl,
                    MaxImageSize = MaxImageSize,
                    ResponseString = responseString
                },
                JsonRequestBehavior = JsonRequestBehavior.AllowGet
            };
        }
    }
}