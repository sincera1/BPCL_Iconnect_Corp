import * as React from "react";
import { Modal, Carousel } from "react-bootstrap";
import styles from "../components/BpclIConnectHome.module.scss";

interface IAttachment {
  FileName: string;
  ServerRelativeUrl: string;
}

interface IBroadcastPreviewItem {
  Id: number;
  Title: string;
  PublishedDate?: string;
  RelatedSiteURL?: {
    Url: string;
    Description: string;
  };
}

interface Props {
  show: boolean;
  onClose: () => void;
  item?: IBroadcastPreviewItem;
  attachments?: IAttachment[];
}

const PreviewBroadcastModal: React.FC<Props> = ({
  show,
  onClose,
  item,
  attachments = [],
}) => {
  if (!item) return null;

  const isImage = (fileName: string): boolean =>
    /\.(png|jpe?g|gif)$/i.test(fileName);

  const isPdf = (fileName: string): boolean =>
    /\.pdf$/i.test(fileName);

  const imageAttachments: IAttachment[] = attachments.filter((a) =>
    isImage(a.FileName)
  );

  const pdfAttachments: IAttachment[] = attachments.filter((a) =>
    isPdf(a.FileName)
  );

  const relatedUrl = item.RelatedSiteURL?.Url?.trim();

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className={styles.pageTitle}>
          {item.Title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className={`p-3 ${styles.modalBody}`}>

        {/* Single Image */}

        {/* Single Image */}
        {imageAttachments.length === 1 && (
          <div className="mb-3">
            {relatedUrl ? (
              <a
                href={relatedUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ cursor: "pointer", display: "block" }}
              >
                <img
                  src={imageAttachments[0].ServerRelativeUrl}
                  alt="Broadcast"
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "cover",
                  }}
                />
              </a>
            ) : (
              <img
                src={imageAttachments[0].ServerRelativeUrl}
                alt="Broadcast"
                style={{
                  width: "100%",
                  height: "auto",
                  objectFit: "cover",
                }}
              />
            )}
          </div>
        )}

        {/* Multiple Images */}
        {imageAttachments.length > 1 && (
          <Carousel controls={false} indicators={false} className="mb-3">
            {imageAttachments.map((img, index) => (
              <Carousel.Item key={index}>
                {relatedUrl ? (
                  <a
                    href={relatedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ cursor: "pointer", display: "block" }}
                  >
                    <img
                      src={img.ServerRelativeUrl}
                      alt={img.FileName}
                      style={{
                        width: "100%",
                        height: "360px",
                        objectFit: "cover",
                      }}
                    />
                  </a>
                ) : (
                  <img
                    src={img.ServerRelativeUrl}
                    alt={img.FileName}
                    style={{
                      width: "100%",
                      height: "360px",
                      objectFit: "cover",
                    }}
                  />
                )}
              </Carousel.Item>
            ))}
          </Carousel>
        )}



        {/* Multiple Images */}
        {imageAttachments.length > 1 && (
          <Carousel controls={false} indicators={false} className="mb-3">
            {imageAttachments.map((img, index) => (
              <Carousel.Item key={index}>
                <a
                  href={item.RelatedSiteURL?.Url || undefined}
                  target={item.RelatedSiteURL?.Url ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  style={{
                    cursor: item.RelatedSiteURL?.Url ? "pointer" : "default",
                  }}
                >
                  <img
                    src={img.ServerRelativeUrl}
                    alt={img.FileName}
                    style={{
                      width: "100%",
                      height: "360px",
                      objectFit: "cover",
                    }}
                  />
                </a>
              </Carousel.Item>
            ))}
          </Carousel>
        )}

        {/* Date */}
        <p className="mb-3 text-muted">
          {item.PublishedDate
            ? new Date(item.PublishedDate).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })
            : ""}
        </p>


        {/* PDF Attachments */}
        {pdfAttachments.length > 0 && (
          <div className="mt-3">
            <h6>Attachments</h6>
            <ul className="list-unstyled">
              {pdfAttachments.map((pdf, index) => (
                <li key={index}>
                  <a
                    href={pdf.ServerRelativeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📄 {pdf.FileName}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default PreviewBroadcastModal;