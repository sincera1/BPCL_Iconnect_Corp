import * as React from "react";
import { Carousel, Modal } from "react-bootstrap";
import styles from "../components/BpclIConnectHome.module.scss";

interface IAttachment {
  FileName: string;
  ServerRelativeUrl: string;
}

interface IEventPreviewItem {
  Id: number;
  Title?: string;
  PublishedDate?: string;
  MainDescription?: string;
  Thumbnail?: string;
  ThumbnailCaption?: string;
  RelatedSiteURL?: {
    Url: string;
    Description: string;
  };
}

interface Props {
  show: boolean;
  onClose: () => void;
  item?: IEventPreviewItem;
  attachments?: IAttachment[];
}

const SITE_URL = "https://bharatpetroleum.sharepoint.com";

const PreviewEventsModal: React.FC<Props> = ({
  show,
  onClose,
  item,
  attachments = [],
}) => {
  if (!show || !item) {
    return null;
  }

  const getFileUrl = (fileName: string): string => {
    const attachment = attachments.find(
      (att) => att.FileName === fileName
    );

    return attachment
      ? `${SITE_URL}${attachment.ServerRelativeUrl}`
      : "";
  };

  const images: string[] = [];

  if (item.Thumbnail) {
    const thumbnailUrl = getFileUrl(item.Thumbnail);

    if (thumbnailUrl) {
      images.push(thumbnailUrl);
    }
  }

  // If the thumbnail is missing or not found, use all attachments.
  if (images.length === 0 && attachments.length > 0) {
    attachments.forEach((attachment) => {
      images.push(
        `${SITE_URL}${attachment.ServerRelativeUrl}`
      );
    });
  }

  const relatedUrl = item.RelatedSiteURL?.Url?.trim();

  const handleImageClick = (): void => {
    

    if (!relatedUrl) {
      return;
    }

    try {
      const parsedUrl = new URL(relatedUrl);

       if (
        parsedUrl.protocol !== "https:" &&
        parsedUrl.protocol !== "http:"
      ) {
        return;
      }

      window.open(
        parsedUrl.href,
        "_blank",
        "noopener,noreferrer"
      );
    } catch  {
      return;
    }
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="lg"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title className={styles.pageTitle}>
          {item.Title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className={`p-3 ${styles.modalBody}`}>
        {/* Event Images */}
        {images.length > 0 && (
          <Carousel
            controls={false}
            indicators={false}
            pause="hover"
          >
            {images.map((imageUrl, index) => (
              <Carousel.Item key={index}>
                <img
                  src={imageUrl}
                  alt={item.Title || "Event"}
                  className="d-block w-100"
                  onClick={handleImageClick}
                  style={{
                    height: "auto",
                    objectFit: "contain",
                    cursor: relatedUrl ? "pointer" : "default",
                  }}
                />
              </Carousel.Item>
            ))}
          </Carousel>
        )}

        {/* Event Date */}
        {item.PublishedDate && (
          <p className="mt-3 mb-2 fw-semibold">
            {new Date(
              item.PublishedDate
            ).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}

        {/* Event Description */}
        {item.MainDescription && (
          <div
            className={styles.previewDesc}
            dangerouslySetInnerHTML={{
              __html: item.MainDescription,
            }}
          />
        )}
      </Modal.Body>
    </Modal>
  );
};

export default PreviewEventsModal;