import React, { useEffect, useState } from "react";
import "./CSS/Placedetails.css";
import { useParams, useNavigate } from "react-router-dom";
import star from "../components/Assets/star.png";
import axios from "axios";
import ReactPlayer from "react-player";
import checkAdmin from "../util/Token";
import ImagePopup from "../components/ImagePopup/ImagePopup";
import Map from "../components/Map/Map";
import user_icon from "../components/Assets/user.png";
import ReadMore from "../components/ReadMore/ReadMore";
import explore_icons from "../components/Assets/explore_white.png";

const Placedetails = () => {
  const navigate = useNavigate();
  const { placeId } = useParams();
  const [loading, setLoading] = useState(true);
  const [combinedData, setCombinedData] = useState(null); // Store combined data here
  const [galleryImages, setGalleryImages] = useState([]);
  const [clickedImg, setClickedImg] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleMapClick = (loc) => {
    window.location.href = `https://maps.google.com/?q=${loc}`;
  };

  useEffect(() => {
    checkAdmin(setIsAdmin);
  });

  const handleClick = (item) => {
    setClickedImg(item.imageUrl);
  };

  const handleTheClick = (item) => {
    setClickedImg(item.monument.imageUrl);
  };

  const clickToVerify = (Id) => {
    let cfm = confirm("Confirm verification");
    if (!cfm) return;
    else {
      axios
        .put(`admin/verify/${Id}`)
        .then((res) => {
          alert(res.data.message);
          navigate("/manage/ListMonuments");
        })
        .catch((err) => {
          alert("Error verifing : " + err.message);
        });
    }
  };

  const clickToUnverify = (Id) => {
    let cfm = confirm("Do you want to edit the verification");
    if (!cfm) return;
    else {
      axios
        .put(`admin/unverify/${Id}`)
        .then((res) => {
          alert(res.data.message);
          navigate("/manage/ListMonuments");
        })
        .catch((err) => {
          alert("Error verifing : " + err.message);
        });
    }
  };

  const isValidLatLong = (location) => {
    const lat = location.split(",")[0];
    const long = location.split(",")[1];

    if (!isNaN(parseFloat(lat)) && !isNaN(parseFloat(long))) return true;
    return false;
  };

  useEffect(() => {
    axios
      .get(`public/${placeId}`)
      .then((response) => {
        setCombinedData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching combined data:", error);
      });
  }, [placeId]);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`public/monument/${placeId}`)
      .then((response) => {
        setGalleryImages(response.data);
      })
      .catch((error) => {
        console.error("Error fetching gallery images:", error.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="place-details">
      {loading ? (
        <div className="loader">
          <div className="img-loader"></div>

          <div className="importance">
            <div className="top">
              <img src={star} alt="" />
              <h4>Importance</h4>
            </div>
          </div>

          <div className="about-monument">
            <h4>ABOUT MONUMENT</h4>
            <div className="line"></div>
          </div>

          <div className="about-monument">
            <h4>PRESENT CONDITION</h4>
            <div className="line"></div>
          </div>

          <div className="about-monument">
            <h4>PRESENT CONDITION</h4>
            <div className="line"></div>
          </div>

          <div className="arch-imp">
            <h4>Architectural Importance</h4>
          </div>
        </div>
      ) : (
        combinedData && (
          <>
            <div className="place-img">
              <img
                src={combinedData.monument.imageUrl}
                onClick={() => handleTheClick(combinedData)}
                alt=""
              />
              {clickedImg && (
                <ImagePopup
                  clickedImg={clickedImg}
                  setClickedImg={setClickedImg}
                />
              )}
              <div className="name-loc">
                <h2>{combinedData.monument.title}</h2>
                <div className="locatn">
                  <img src={explore_icons} alt="" />
                  <div>
                    <p>
                      {combinedData.monument.place},{" "}
                      {combinedData.monument.state}
                    </p>
                  </div>
                </div>

                <div className="user-icon">
                  <img src={user_icon} alt="" />
                  <p>{combinedData.userName}</p>
                </div>
              </div>
            </div>
            <div className="importance">
              <div className="top">
                <img src={star} alt="" />
                <h4>Importance</h4>
              </div>
              <ReadMore sliceLength={350}>
                {combinedData.monument.ipms_place}
              </ReadMore>
            </div>

            <div className="about-monument">
              <h4>ABOUT MONUMENT</h4>
              <div className="line"></div>
              <ReadMore sliceLength={600}>
                {combinedData.monument.description}
              </ReadMore>
            </div>

            <div className="about-monument">
              <h4>PAST CONDITION</h4>
              <div className="line"></div>
              <ReadMore sliceLength={600}>
                {combinedData.monument.past_condition}
              </ReadMore>
            </div>

            <div className="about-monument">
              <h4>PRESENT CONDITION</h4>
              <div className="line"></div>
              <ReadMore sliceLength={600}>
                {combinedData.monument.present_condition}
              </ReadMore>
            </div>

            <div className="arch-imp">
              <h4>Architectural Importance</h4>
              <ReadMore sliceLength={350}>
                {combinedData.monument.archi_imps}
              </ReadMore>
            </div>

            <div className="gallery">
              <h4>GALLERY</h4>
              <div className="line"></div>

              {loading ? (
                "Loading..."
              ) : (
                <div className="all-items">
                  {galleryImages &&
                    galleryImages
                      .filter((item) => item.monumentId === placeId)
                      .map((item, index) => (
                        <div className="gallery-images" key={item._id}>
                          {item.image.endsWith(".mp4") ? (
                            <ReactPlayer
                              url={item.imageUrl}
                              controls
                              width="100%"
                              height={371}
                              volume={null}
                              muted
                            />
                          ) : (
                            <img
                              src={item.imageUrl}
                              onClick={() => handleClick(item)}
                            />
                          )}
                          <div>
                            {clickedImg && (
                              <ImagePopup
                                clickedImg={clickedImg}
                                setClickedImg={setClickedImg}
                              />
                            )}
                          </div>
                          <div className="gallery-title">
                            <p className="titles">{item.imgTitle}</p>
                          </div>
                        </div>
                      ))}
                </div>
              )}
            </div>

            <div className="gallery">
              <h4>MAP</h4>
              <div className="line map-line"></div>
              <div className="map">
                {combinedData.monument.location &&
                isValidLatLong(combinedData.monument.location) ? (
                  <div className="mapview">
                    <Map
                      latitude={combinedData.monument.location.split(",")[0]}
                      longitude={combinedData.monument.location.split(",")[1]}
                    />
                  </div>
                ) : undefined}
              </div>
            </div>

            <div className="map-btn">
              {/* <img src={gmap} alt="" /> */}
              <button
                className="w3-button w3-green"
                onClick={() => handleMapClick(combinedData.monument.location)}
              >
                <i className="fa fa-map-marker" aria-hidden="true"></i>GOOGLE
                MAPS
              </button>
            </div>

            {isAdmin ? (
              <div className="verify">
                {combinedData.monument.status == 1 ? (
                  <button
                    className="btn"
                    onClick={() => clickToUnverify(combinedData.monument._id)}
                  >
                    Unverify
                  </button>
                ) : (
                  <button
                    className="btn"
                    onClick={() => clickToVerify(combinedData.monument._id)}
                  >
                    Verify
                  </button>
                )}
              </div>
            ) : (
              false
            )}
          </>
        )
      )}
    </div>
  );
};

export default Placedetails;
