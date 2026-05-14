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

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className={styles.pageTitle}>
          {item.Title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className={`p-3 ${styles.modalBody}`}>

        {/* Single Image */}
        {imageAttachments.length === 1 && (
          <img
            src={imageAttachments[0].ServerRelativeUrl}
            alt="Broadcast"
            style={{
              width: "100%",
              height: "auto",
              objectFit: "cover",
              marginBottom: "16px",
            }}
          />
        )}

        {/* Multiple Images */}
        {imageAttachments.length > 1 && (
          <Carousel controls={false} indicators={false} className="mb-3">
            {imageAttachments.map((img, index) => (
              <Carousel.Item key={index}>
                <img
                  src={img.ServerRelativeUrl}
                  alt={img.FileName}
                  style={{
                    width: "100%",
                    height: "360px",
                    objectFit: "cover",
                  }}
                />
              </Carousel.Item>
            ))}
          </Carousel>
        )}

        {/* Date */}
        <p className="mb-3 text-muted">
          {item.PublishedDate
            ? new Date(item.PublishedDate).toLocaleDateString()
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