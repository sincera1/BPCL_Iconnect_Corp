import * as React from 'react';
//import '@fontsource/inter';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './BpclIConnectHome.module.scss';
import type { IBpclIConnectHomeProps } from './IBpclIConnectHomeProps';
import type { CarouselRef } from 'react-bootstrap/Carousel';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
//import 'swiper/css';
import "swiper/swiper-bundle.css";
// import 'swiper/css/navigation';
// import 'swiper/css/pagination';
import 'bootstrap-icons/font/bootstrap-icons.css';

import BpclIconnectHomeServices, { IBGBannerItem, IQuickLinkItem, ICorporateNewsItem, IBusinessUnitItem, IVMVItem, IGovernanceItem, IReportItem, IBroadcastItem, IAttachment, INewsPreviewItem, IEventPreviewItem } from "../Services/BpclIconnectHomeServices";

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Carousel from 'react-bootstrap/Carousel';

import PreviewBroadcastModal from "../Services/PreviewBroadcastModel";
import PreviewEventsModal from "../Services/PreviewEventsModal";
import PreviewNewsModal from "../Services/PreviewNewsModal";
import Loader from "../Services/Loader";
import { StaffPostingService } from "../Services/StaffPostingService";
import StaffPostingModal from "../Services/StaffPostingModal";


interface IIConnectHomeState {
  isLoading: boolean;
  isPaused: boolean;
  bgBanners: IBGBannerItem[];
  quickLinks: IQuickLinkItem[];
  businessUnits: IBusinessUnitItem[];
  vmvItems: IVMVItem[];
  vmvIcons: Map<string, string>;
  governanceItems: IGovernanceItem[];
  reportItems: IReportItem[];
  corporateNews: ICorporateNewsItem[];
  events: ICorporateNewsItem[];
  brands: ICorporateNewsItem[];
  broadcasts: IBroadcastItem[];
  showPreview: boolean;
  previewItem?: IBroadcastItem;
  previewAttachments: IAttachment[];

  // ✅ Events preview
  showEventPreview: boolean;
  previewEventItem?: IEventPreviewItem;
  previewEventAttachments: IAttachment[];

  showNewsPreview: boolean;
  selectedNewsItem?: INewsPreviewItem;
  newsAttachments: IAttachment[];

  expandedCard: string | null;
  overflowMap: { [key: string]: boolean };


}



/* -------------------- Helpers -------------------- */

const chunkArray = <T,>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/* -------------------- Component -------------------- */

export default class IConnectHome extends React.Component<
  IBpclIConnectHomeProps,
  IIConnectHomeState
> {
  private carouselRef = React.createRef<CarouselRef>();

  state: IIConnectHomeState = {
    isLoading: true,
    isPaused: false,
    bgBanners: [],
    quickLinks: [],
    businessUnits: [],
    vmvItems: [],
    vmvIcons: new Map(),
    governanceItems: [],
    reportItems: [],
    corporateNews: [],
    events: [],
    brands: [],
    broadcasts: [],
    showPreview: false,
    previewItem: undefined,
    previewAttachments: [],
    // ✅ Events
    showEventPreview: false,
    previewEventItem: undefined,
    previewEventAttachments: [],
    //News
    showNewsPreview: false,
    selectedNewsItem: undefined,
    newsAttachments: [],
    expandedCard: null,
    overflowMap: {}


  };

  private homeService!: BpclIconnectHomeServices;
  private staffPostingService!: StaffPostingService;

  public async componentDidMount(): Promise<void> {
    this.homeService = new BpclIconnectHomeServices(this.props.context);
    this.staffPostingService = new StaffPostingService(

      //this.homeService["publishingHubSp"],
      this.homeService.publishingHubSp,

      this.props.context

    );

    try {
      const [bgBanners, quickLinks, businessUnits, vmvItems, governanceItems, reportItems, corporateNews, events, brands, broadcasts, vmvIcons] = await Promise.all([
        this.homeService.getBGBanner(),
        this.homeService.getQuickLinks(),
        this.homeService.getBusinessUnits(),
        this.homeService.getVisionMissionValues(),
        this.homeService.getGovernanceItems(),
        this.homeService.getReportItems(),
        this.homeService.getCorporateNews(),
        this.homeService.getEvents(),
        this.homeService.getBrands(),
        this.homeService.getBroadcasts(),
        this.homeService.getVMVIcons()

      ]);

      this.setState({ bgBanners, quickLinks, businessUnits, vmvItems, governanceItems, reportItems, corporateNews, events, brands, broadcasts, vmvIcons, isLoading: false },
        () => {
          // ✅ Call after DOM updates
          setTimeout(() => {
            this.checkOverflow();
          }, 0);
        }
      );

    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
    }
  }



  private openBroadcastPreview = async (item: IBroadcastItem): Promise<void> => {
    try {
      const attachments = await this.homeService.getAttachments(item.Id);
      console.log("Broadcast attachments from service:", attachments);

      this.setState({
        showPreview: true,
        previewItem: item,
        previewAttachments: attachments
      });
    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
    }
  };

  private closeBroadcastPreview = (): void => {
    this.setState({
      showPreview: false,
      previewItem: undefined,
      previewAttachments: []
    });
  };

  private openEventPreview = async (item: ICorporateNewsItem): Promise<void> => {
    try {
      const attachments = await this.homeService.getAttachments(item.Id);
      console.log("Event attachments:", attachments);

      this.setState({
        showEventPreview: true,
        previewEventItem: item,
        previewEventAttachments: attachments
      });
    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
    }
  };

  private closeEventPreview = (): void => {
    this.setState({
      showEventPreview: false,
      previewEventItem: undefined,
      previewEventAttachments: []
    });
  };

  private openNewsPreview = async (
    item: ICorporateNewsItem
  ): Promise<void> => {
    try {

      // If Staff Posting → no need to fetch preview + attachments
      if (item.NewsTypes?.WssId === 24) {
        this.setState({
          showNewsPreview: true,
          selectedNewsItem: item,
          newsAttachments: []
        });
        return;
      }

      // Normal News Preview
      const [previewItem, attachments] = await Promise.all([
        this.homeService.getNewsPreviewItem(item.Id),
        this.homeService.getAttachments(item.Id)
      ]);

      if (!previewItem) return;

      this.setState({
        showNewsPreview: true,
        selectedNewsItem: previewItem,
        newsAttachments: attachments
      });

    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
    }
  };

  private closeNewsPreview = (): void => {
    this.setState({
      showNewsPreview: false,
      selectedNewsItem: undefined,
      newsAttachments: []
    });
  };


  private handleNewsLike = async (
    item: ICorporateNewsItem
  ): Promise<void> => {
    try {
      const updatedLikes = await this.homeService.toggleLike(
        item.Id,
        item.liked === true
      );

      this.setState((prev) => ({
        corporateNews: prev.corporateNews.map((n) =>
          n.Id === item.Id
            ? {
              ...n,
              LikesCount: updatedLikes,
              liked: !n.liked
            }
            : n
        ),
      }));
    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
    }
  };

  private handleEventLike = async (
    event: ICorporateNewsItem
  ): Promise<void> => {

    try {

      const updatedLikes = await this.homeService.toggleLike(
        event.Id,
        event.liked === true
      );

      this.setState((prev) => ({
        events: prev.events.map((e) =>
          e.Id === event.Id
            ? {
              ...e,
              LikesCount: updatedLikes,
              liked: !e.liked
            }
            : e
        ),
      }));

    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
    }
  };

  private checkOverflow = () => {
    const elements = document.querySelectorAll(".carousel-title");

    elements.forEach((el) => {
      const element = el as HTMLElement;

      const isOverflowing =
        element.scrollWidth > element.clientWidth;

      if (isOverflowing) {
        element.setAttribute("title", element.innerText);
      } else {
        element.removeAttribute("title");
      }
    });
  };

  public componentDidUpdate(): void {
    this.checkOverflow();
  }

  public render(): React.ReactElement {

    const quickLinkSlides = chunkArray(this.state.quickLinks, 8);


    const handleTitleRef = (text: string) => (el: HTMLElement | null) => {
      if (!el) return;

      setTimeout(() => {
        const isOverflowing = el.scrollWidth > el.clientWidth;

        if (isOverflowing) {
          el.setAttribute("title", text);
        } else {
          el.removeAttribute("title");
        }
      }, 0);
    };

    const categories = ["Mission", "Vision", "Values", "Culture"];

    const groupedVMV = categories.map((cat, index) => ({

      Id: index + 1,
      Title: cat,

      Items: this.state.vmvItems
        .filter((i) => (i.Category || "").trim() === cat)
        .sort((a, b) => a.Sequence - b.Sequence),

      ImageUrl: this.state.vmvIcons?.get(cat)

    }));



    return (
      <Container fluid className='p-0'>
        <Loader show={this.state.isLoading} />
        <div className={styles.dashboardWrapper}>
          <div
            className={styles.topImageSection}
            style={{
              backgroundImage:
                this.state.bgBanners.length > 0
                  ? `url(${this.state.bgBanners[0].ImageUrl})`
                  : undefined
            }}
          >
            <div className={styles.topImageContent}>
              <Row className="px-md-4">

                {/* Page Heading Section */}
                <Col
                  xs={{ span: 12, order: 0 }}
                  lg={{ span: 5, order: 1 }}
                >
                  <div className={styles.bannerRightContent}>
                    <h5 className={styles.pageHeading}>
                      Hello, {this.props.context.pageContext.user.displayName}
                    </h5>

                    <h6 className={styles.pageSubHeading}>
                      {this.state.bgBanners[0]?.BannerHeading ??
                        "Let us accomplish something today."}
                    </h6>
                  </div>
                </Col>


                {/* Banner Section */}
                <Col
                  xs={{ span: 12, order: 1 }}
                  lg={{ span: 7, order: 0 }}
                >
                  <div className={styles.bannerWrapper}>
                    {this.state.brands.length === 0 ? (
                      <div className={styles.noDataWrapper}>
                        <p className={styles.noDataText}>
                          No data available.
                        </p>
                      </div>
                    ) : (
                      <Carousel controls={false} interval={4000} indicators onSlid={() => this.checkOverflow()}>
                        {this.state.brands.map((item, i) => (
                          <Carousel.Item key={item.Id}>
                            <div
                              className={styles.slide}
                              onClick={() => {
                                if (item.RedirectURL?.Url) {
                                  window.open(item.RedirectURL.Url, "_blank");
                                }
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <img
                                src={item.ImageUrl}
                                alt={item.Title}
                              />

                              <div className={styles.content}>
                                <h6>
                                  {new Date(item.PublishedDate).toLocaleDateString("en-GB", {
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </h6>

                                <h4 className="carousel-title">
                                  {item.Title}
                                </h4>

                              </div>
                            </div>
                          </Carousel.Item>
                        ))}
                      </Carousel>
                    )}
                  </div>
                </Col>


                {/* Quick Links Section */}
                <Col
                  xs={{ span: 12, order: 2 }}
                  lg={{ span: 5, order: 2, offset: 7 }}
                  className={styles.QLContainer}
                >
                  <Card className={styles.qlCard}>
                    <Card.Body>
                      <h6 className={`${styles.pageSubHeading} px-md-3`}>
                        Quick Links
                      </h6>

                      {quickLinkSlides && quickLinkSlides.length > 0 ? (

                        <Carousel
                          indicators={true}
                          controls={false}
                          interval={null}
                          className={styles.quickLinksCarousel}
                        >
                          {quickLinkSlides.map((slide, pageIndex) => (
                            <Carousel.Item key={pageIndex}>
                              <Row className="mx-2 my-1">
                                {slide.map(item => (
                                  <Col
                                    md={3}
                                    xs={3}
                                    key={item.Id}
                                    className={styles.qlContent}
                                  >
                                    <a
                                      href={item.RedirectURL?.Url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <img
                                        src={item.ImageUrl}
                                        alt={item.Title}
                                        className={styles.quickLinksIcon}
                                      />

                                      <h6 className={styles.qlDescription}>
                                        {item.Title}
                                      </h6>
                                    </a>
                                  </Col>
                                ))}
                              </Row>
                            </Carousel.Item>
                          ))}
                        </Carousel>

                      ) : (
                        <div className="text-center py-4">
                          No data available
                        </div>
                      )}

                    </Card.Body>
                  </Card>
                </Col>

              </Row>
            </div>
          </div>
        </div>


        {/* ---------------- News Carousel ---------------- */}
        <Row>
          <Col md={12} className="px-2">
            <div className={styles.newsCarouselSection}>
              <div className="d-flex justify-content-between align-items-center">
                <h4 className={styles.sectionHeading}>Corporate News</h4>
                <h6 className={styles.seeAll}>
                  <span
                    className={styles.seeAll}
                    role="link"
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      const folderUrl =
                        `${this.props.context.pageContext.web.absoluteUrl}/SitePages/ViewAllNews.aspx`;

                      window.open(folderUrl, "_blank");
                    }}

                  >
                    See All
                  </span>
                </h6>
              </div>

              <div className={styles.carouselWrapper}>

                {/* Left Arrow */}
                <div className={styles.newsPrevBtn}>
                  <i className="bi bi-chevron-left" />
                </div>

                <Swiper

                  modules={[Navigation, Autoplay]}

                  spaceBetween={20}

                  loop={this.state.corporateNews.length > 4}

                  slidesPerGroup={1}

                  navigation={true}



                  observer={true}

                  observeParents={true}

                  onBeforeInit={(swiper) => {

                    if (swiper.params.navigation && typeof swiper.params.navigation !== "boolean") {

                      const navigation = swiper.params.navigation;

                      navigation.prevEl = `.${styles.newsPrevBtn}`;

                      navigation.nextEl = `.${styles.newsNextBtn}`;

                    }

                  }}

                  breakpoints={{

                    0: { slidesPerView: 1 },

                    768: { slidesPerView: 2 },

                    992: { slidesPerView: 4 },

                  }}
                >

                  {this.state.corporateNews.map((item) => (
                    <SwiperSlide key={item.Id}>
                      <Card className={styles.newsCard}>

                        {/* Image Wrapper */}
                        <div

                          className={styles.imageWrapper}

                          role="button"

                          tabIndex={0}

                          onClick={() => {
                            this.openNewsPreview(item).catch(() => {
                              console.error("Something went wrong. Please contact administrator.");
                            });
                          }}


                        >
                          <Card.Img

                            variant="top"

                            src={item.ImageUrl}

                            alt={item.Title}

                          />

                          {/* Like Overlay */}
                          <div

                            className={`${styles.likeOverlay} ${item.liked ? styles.liked : ""}`}

                            onClick={(e) => {

                              e.stopPropagation();

                              this.handleNewsLike(item).catch(() => {

                                console.error(
                                  "Something went wrong. Please contact administrator."
                                );

                              });

                            }}
                          >
                            <i className="bi bi-hand-thumbs-up-fill" />
                            <span>{item.LikesCount ?? 0}</span>
                          </div>
                        </div>

                        <Card.Body className={styles.newsContent}>
                          <span className={styles.dateText}>

                            {new Date(item.PublishedDate).toLocaleDateString()}
                          </span>

                          <Card.Title
                            className={styles.titleText}
                            ref={handleTitleRef(item.Title)}

                          >
                            {item.Title}
                          </Card.Title>


                        </Card.Body>

                      </Card>
                    </SwiperSlide>

                  ))}
                </Swiper>

                {/* Right Arrow */}
                <div className={styles.newsNextBtn}>
                  <i className="bi bi-chevron-right" />
                </div>

              </div>

            </div>
          </Col>
        </Row>


        {/* ---------------- Broadcast Carousel ---------------- */}
        <Row>
          <Col md={12} className="px-2">
            <div className={styles.broadcastsCarouselSection}>
              <h4 className={styles.sectionHeading}>Corporate Broadcasts</h4>

              <div className={styles.carouselWrapper}>
                <div className={styles.topRightControls}>
                  {/* Pause / Play */}
                  <button
                    type="button"
                    className={styles.pauseBtn}
                    onClick={() =>
                      this.setState({ isPaused: !this.state.isPaused })
                    }
                  >
                    {this.state.isPaused ? "▶" : "⏸"}
                  </button>
                  <span
                    className={styles.seeAll}
                    role="link"
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      const folderUrl =
                        `${this.props.context.pageContext.web.absoluteUrl}/SitePages/ViewAllBroadcast.aspx`;
                      window.open(folderUrl, "_blank");
                    }}

                  >
                    See All
                  </span>


                </div>

                {this.state.broadcasts.length === 0 ? (
                  <div className={styles.noDataWrapper}>
                    <p className={styles.noDataText}>No broadcasts available.</p>
                  </div>
                ) : (
                  <Carousel
                    ref={this.carouselRef}
                    interval={null}
                    pause={false}
                    indicators={false}
                    controls={false}
                  >
                    <Carousel.Item>
                      <div className={styles.marqueeContainer}>
                        <div
                          className={`${styles.marqueeTrack} ${this.state.isPaused ? styles.paused : ""
                            }`}
                        >
                          {[...this.state.broadcasts, ...this.state.broadcasts].map(
                            (item, index) => (
                              <div
                                key={index}
                                className={styles.marqueeCard}
                                role="button"
                                tabIndex={0}
                                onClick={() => this.openBroadcastPreview(item)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && this.openBroadcastPreview(item)
                                }
                              >
                                <img
                                  src={item.IconUrl}
                                  alt={item.BroadcastType.Label}
                                  width={70}
                                />

                                <div className="me-2 p-2">


                                  <h3 className={styles.titleText}>
                                    {item.Title}
                                  </h3>


                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </Carousel.Item>
                  </Carousel>
                )}
              </div>
            </div>
          </Col>
        </Row>


        {/* ---------------- Events Section ---------------- */}
        <Row>
          <Col md={12} className="px-2">
            <div className={styles.eventContentSection}>
              <div className="d-flex justify-content-between">
                <h4 className={styles.sectionHeading}>Corporate Events</h4>
                <span
                  className={styles.seeAll}
                  role="link"
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                  onClick={() => {

                    const folderUrl =
                      `${this.props.context.pageContext.web.absoluteUrl}/SitePages/ViewAllEvents.aspx`;
                    window.open(folderUrl, "_blank");
                  }}

                >
                  See All
                </span>

              </div>

              {this.state.events.length === 0 ? (
                /* No Data */
                <div className={styles.noDataWrapper}>
                  <p className={styles.noDataText}>No events available.</p>
                </div>
              ) : (
                <div className={styles.carouselWrapper}>

                  {/* Left Arrow */}
                  <div className={styles.swiperButtonPrev}>
                    <i className="bi bi-chevron-left" />
                  </div>
                  <Swiper
                    modules={[Navigation, Autoplay]}
                    spaceBetween={20}
                    loop={true}
                    slidesPerGroup={1}
                    // autoplay={{
                    //   delay: 4000,
                    //   disableOnInteraction: false,
                    // }}
                    navigation={{
                      prevEl: `.${styles.swiperButtonPrev}`,
                      nextEl: `.${styles.swiperButtonNext}`,
                    }}
                    breakpoints={{
                      0: { slidesPerView: 1 },
                      768: { slidesPerView: 2 },
                      992: { slidesPerView: 4 },
                    }}

                  >
                    {this.state.events.map((event) => (
                      <SwiperSlide key={event.Id}>
                        <Card className={styles.eventCard}>

                          {/* 🔹 Image Wrapper (same as News) */}
                          <div
                            className={styles.imageWrapper}
                            role="button"
                            tabIndex={0}
                            onClick={() => this.openEventPreview(event)}

                          >
                            {event.ImageUrl && (
                              <Card.Img
                                variant="top"
                                src={event.ImageUrl}
                                alt={event.Title}
                              />
                            )}

                            {/* 👍 Like overlay on image */}
                            <div
                              className={`${styles.likeOverlay} ${event.liked ? styles.liked : ""
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();

                                this.handleEventLike(event).catch(() => {
                                  console.error("Something went wrong. Please contact administrator.");
                                });
                              }}
                            >
                              <i className="bi bi-hand-thumbs-up-fill" />
                              <span>{event.LikesCount}</span>
                            </div>
                          </div>

                          <Card.Body >
                            <span className={styles.dateText}>
                              {new Date(event.PublishedDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>



                            <Card.Title
                              className={styles.eventTitle}
                              ref={handleTitleRef(event.Title)}
                            >
                              {event.Title}
                            </Card.Title>


                          </Card.Body>

                        </Card>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                  {/* Right Arrow */}
                  <div className={styles.swiperButtonNext}>
                    <i className="bi bi-chevron-right" />
                  </div>

                </div>
              )}
            </div>
          </Col>
        </Row>


        <Row className={`${styles.parallelCarouselSection} d-flex justify-content-center mx-0`}>

          {/* ---------------- Governance Carousel ---------------- */}
          <Col md={6} className="px-0 px-lg-2">
            <div className={styles.governanceCarouselSection}>
              <Card className={styles.messageBorderCard}>
                <Card.Body>

                  {this.state.governanceItems && this.state.governanceItems.length > 0 ? (

                    <Carousel
                      indicators
                      controls={false}
                      interval={10000}
                      className={styles.governanceCarousel}
                    >
                      {this.state.governanceItems.map(item => (
                        <Carousel.Item key={item.Id}>
                          <a
                            href={item.FileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-interception="off"
                            className="text-decoration-none"
                          >
                            <div className={styles.bannerCard}>
                              <div className={styles.leftContent}>
                                <img
                                  src={item.ImageUrl}
                                  alt={item.Title}
                                  className={styles.profileImg}
                                />

                                <div className={styles.rightContent}>

                                  <h3 className={styles.title} ref={handleTitleRef(item.Title)}>{item.Title}</h3>
                                  <p className={styles.desc} style={{ WebkitLineClamp: 2 }}
                                    ref={(el) => {
                                      if (el) {
                                        setTimeout(() => {
                                          const isOverflowing = el.scrollHeight > el.clientHeight;

                                          if (isOverflowing) {
                                            el.setAttribute("title", el.innerText);
                                          } else {
                                            el.removeAttribute("title");
                                          }
                                        }, 0);
                                      }
                                    }}
                                  >{item.Description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </a>
                        </Carousel.Item>
                      ))}
                    </Carousel>

                  ) : (
                    <div className="text-center py-4">
                      No data available to display
                    </div>
                  )}

                </Card.Body>
              </Card>
            </div>
          </Col>

          {/* ---------------- Reports Carousel ---------------- */}
          <Col md={6} className="px-0 px-lg-2">
            <div className={styles.reportsCarouselSection}>
              <Card className={styles.messageBorderCard}>
                <Card.Body>

                  {this.state.reportItems && this.state.reportItems.length > 0 ? (

                    <Carousel
                      indicators
                      controls={false}
                      interval={12000}
                      className={styles.reportsCarousel}
                    >
                      {this.state.reportItems.map(item => (
                        <Carousel.Item key={item.Id}>
                          <a
                            href={item.FileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-interception="off"
                            className="text-decoration-none"
                          >
                            <div className={styles.bannerCard}>
                              <div className={styles.leftContent}>
                                <img
                                  src={item.ImageUrl}
                                  alt={item.Title}
                                  className={styles.profileImg}
                                />

                                <div className={styles.rightContent}>
                                  <h3 className={styles.title} ref={handleTitleRef(item.Title)}>{item.Title}</h3>
                                  <p className={styles.desc} style={{ WebkitLineClamp: 2 }}
                                    ref={(el) => {
                                      if (el) {
                                        setTimeout(() => {
                                          const isOverflowing = el.scrollHeight > el.clientHeight;

                                          if (isOverflowing) {
                                            el.setAttribute("title", el.innerText);
                                          } else {
                                            el.removeAttribute("title");
                                          }
                                        }, 0);
                                      }
                                    }}
                                  >{item.Description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </a>
                        </Carousel.Item>
                      ))}
                    </Carousel>

                  ) : (
                    <div className="text-center py-4">
                      No data available to display
                    </div>
                  )}

                </Card.Body>
              </Card>
            </div>
          </Col>

        </Row>

        {/*-------Mission Vision------*/}
        <Row>
          <Col md={12} className="px-2">
            <div className={styles.missionContentSection}>

              {/* Header */}
              <div className={styles.missionHeader}>
                <h4 className={styles.sectionHeading}>
                  Mission, Vision & Values
                </h4>

                <div className={styles.topRightControls}>
                  <button className="mission-prev" aria-label="Previous">
                    <i className="bi bi-chevron-left" />
                  </button>
                  <button className="mission-next" aria-label="Next">
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
              </div>

              {/* Carousel */}
              <Swiper
                modules={[Navigation, Autoplay]}
                spaceBetween={16}
                slidesPerView={4}
                loop={groupedVMV.length > 4}
                navigation={{
                  nextEl: ".mission-next",
                  prevEl: ".mission-prev"
                }}
                breakpoints={{
                  0: { slidesPerView: 1 },
                  576: { slidesPerView: 1.2 },
                  768: { slidesPerView: 2 },
                  992: { slidesPerView: 3 },
                  1200: { slidesPerView: 4 }
                }}
              >
                {groupedVMV.map((item) => (
                  <SwiperSlide key={item.Id}>
                    <div className="w-100">
                      <Card className={`${styles.cardCommon} ${styles.missionCard} h-100`}>
                        <Card.Body>

                          {/* Icon */}
                          <img
                            src={item.ImageUrl || ""}
                            alt={item.Title}
                            width={50}
                          />

                          <div className={styles.missionContent}>

                            {/* Title */}
                            <h5 className={styles.titleText}>
                              {item.Title}
                            </h5>

                            {/* Description */}
                            <div
                              className={`${styles.descWrapper} ${this.state.expandedCard === item.Title
                                ? styles.expanded
                                : ""
                                }`}
                              ref={(el) => {
                                if (
                                  el &&
                                  this.state.overflowMap[item.Title] === undefined
                                ) {
                                  setTimeout(() => {
                                    requestAnimationFrame(() => {

                                      const isOverflowing =
                                        el.scrollHeight > el.clientHeight;

                                      console.log(
                                        item.Title,
                                        "scrollHeight:", el.scrollHeight,
                                        "clientHeight:", el.clientHeight,
                                        "overflow:", isOverflowing
                                      );

                                      this.setState((prev) => ({
                                        overflowMap: {
                                          ...prev.overflowMap,
                                          [item.Title]: true
                                        }
                                      }));

                                    });
                                  }, 500);
                                }
                              }}
                            >
                              <ul className={styles.descList}>
                                {item.Items.map((val, i) => (
                                  <li key={i} className={styles.descItem}>
                                    <span className={styles.tickIcon}>
                                      <i className="bi bi-check-circle-fill" />
                                    </span>
                                    <span>{val.Title}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Expand / Collapse */}
                            {this.state.overflowMap[item.Title] && (
                              <div className={styles.expandBtnWrapper}>
                                <button
                                  className={styles.expandBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();

                                    this.setState((prev) => ({
                                      expandedCard:
                                        prev.expandedCard === item.Title
                                          ? null
                                          : item.Title
                                    }));
                                  }}
                                >
                                  <i
                                    className={`bi ${this.state.expandedCard === item.Title
                                      ? "bi-chevron-up"
                                      : "bi-chevron-down"
                                      }`}
                                  />
                                </button>
                              </div>
                            )}

                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

            </div>
          </Col>
        </Row>

        {/*-------Business Units------*/}
        <Row>
          <Col md={12} className="px-2 mb-3">
            <div className={styles.businessUnitsSection}>
              <h4 className={`${styles.sectionHeading} px-5`}>
                Business Units
              </h4>

              <div className={styles.marqueeWrapper}>
                <div className={styles.marqueeTrack}>
                  {[...this.state.businessUnits, ...this.state.businessUnits].map(
                    (unit, index) => (
                      <div key={index} className={styles.marqueeItem}>
                        <div
                          className={styles.unitCard}
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            const folderUrl = unit.RedirectURL;
                            if (folderUrl) {
                              window.open(folderUrl, "_blank");
                            }
                          }}
                        >
                          <img
                            src={unit.ImageUrl}
                            alt={unit.Title}
                            className={styles.unitImage}
                          />
                          <div className={styles.unitOverlay}>
                            <span className={styles.unitTitle}>
                              {unit.Title}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </Col>
        </Row>

        <PreviewBroadcastModal
          show={this.state.showPreview}
          onClose={this.closeBroadcastPreview}
          item={this.state.previewItem}
          attachments={this.state.previewAttachments}
        />

        <PreviewEventsModal
          show={this.state.showEventPreview}
          onClose={this.closeEventPreview}
          item={this.state.previewEventItem}
          attachments={this.state.previewEventAttachments}
        />

        {this.state.selectedNewsItem &&
          //(this.state.selectedNewsItem.NewsTypes?.Label?.toLowerCase() === "staff posting") ? (
          this.state.selectedNewsItem.NewsTypes?.WssId === 24 ? (
          <StaffPostingModal
            show={this.state.showNewsPreview}
            onClose={this.closeNewsPreview}
            itemId={this.state.selectedNewsItem.Id}
            title={this.state.selectedNewsItem.Title}
            date={this.state.selectedNewsItem.PublishedDate}
            service={this.staffPostingService}
          />
        ) : (
          <PreviewNewsModal
            show={this.state.showNewsPreview}
            onClose={this.closeNewsPreview}
            item={this.state.selectedNewsItem}
            attachments={this.state.newsAttachments}
          />
        )}

      </Container>
    );
  }
}
