import { spfi, SPFx, SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/attachments";
import "@pnp/sp/site-users/web";

import { WebPartContext } from "@microsoft/sp-webpart-base";



export interface IBGBannerItem {
    Id: number;
    ImageUrl: string;
    BannerHeading: string;
}

export interface IQuickLinkItem {
    Id: number;
    Title: string;
    DisplayOrder: number;
    RedirectURL: {
        Url: string;
        Description: string;
    };
    ImageUrl?: string;
}

export interface ICorporateNewsItem {
    Id: number;
    Title: string;
    PublishedDate: string;
    ImageUrl: string;
    LikesCount: number;
    liked?: boolean;

    ThumbnailCaption?: string;
    NewsTypes?: {
        WssId?: number;
        TermGuid?: string;
        Label?: string;
    };
    MainDescription?: string;
    RedirectURL?: {
        Url: string;
        Description: string;
    };

}

export interface IBroadcastItem {
    Id: number;
    Title: string;
    PublishedDate: string;
    BroadcastType: {
        Label: string;
        TermGuid: string;
    };
    IconUrl: string;
}

export interface IBusinessUnitItem {
    Id: number;
    Title: string;
    ImageUrl: string;
    RedirectURL: string;
}

export interface IVMVItem {
    Id: number;
    Title: string;
    Category: string;
    Sequence: number;
}

export interface IGovernanceItem {
    Id: number;
    Title: string;
    Description: string;
    ImageUrl: string;
    FileUrl: string;
}

export interface IReportItem {
    Id: number;
    Title: string;
    Description: string;
    ImageUrl: string;
    FileUrl: string;
}

export interface INewsPreviewItem {
    Id: number;
    Title: string;
    PublishedDate: string;
    MainDescription?: string;
    Thumbnail?: string;
    Picture1?: string;
    Picture2?: string;
    Picture3?: string;
    ThumbnailCaption?: string;
    Pic1Caption?: string;
    Pic2Caption?: string;
    Pic3Caption?: string;
    NewsTypes?: {
        WssId?: number;
        TermGuid?: string;
        Label?: string;
    };
}

export interface IEventPreviewItem {
    Id: number;
    Title: string;
    liked?: boolean;
    MainDescription?: string;
    PublishedDate: string;
    Thumbnail?: string;
    ThumbnailCaption?: string;

}


export interface IAttachment {
    FileName: string;
    ServerRelativeUrl: string;
}

export default class BpclIconnectHomeServices {
    private sp: SPFI;
    public publishingHubSp: SPFI;
    private siteUrl: string;
    private context: WebPartContext;
    private publishingHubUserId!: number;


    private readonly PUBLISHING_HUB_URL: string;




    constructor(context: WebPartContext) {

        const currentUrl = context.pageContext.web.absoluteUrl.toLowerCase();

        if (currentUrl.includes("dev-")) {
            this.PUBLISHING_HUB_URL =
                "https://bharatpetroleum.sharepoint.com/sites/dev-corporate-publishing-hub";
        } else if (currentUrl.includes("qa-")) {
            this.PUBLISHING_HUB_URL =
                "https://bharatpetroleum.sharepoint.com/sites/qa-corporate-publishing-hub";
        } else {
            this.PUBLISHING_HUB_URL =
                "https://bharatpetroleum.sharepoint.com/sites/iconnect-corporate-publishing-hub";
        }

        this.sp = spfi().using(SPFx(context));
        this.publishingHubSp = spfi(this.PUBLISHING_HUB_URL).using(SPFx(context));
        this.siteUrl = context.pageContext.web.absoluteUrl;
        this.context = context;
    }




    public async getBGBanner(): Promise<IBGBannerItem[]> {
        const items = await this.sp.web.lists
            .getByTitle("Corp_DL_BgBanner")
            .items
            .select(
                "Id",
                "BannerHeading",
                "FileRef"
            )
            .orderBy("Id", false)
            .top(1)();


        return items.map(item => ({
            Id: item.Id,
            BannerHeading: item.BannerHeading,
            ImageUrl: item.FileRef

        }));
    }

    public async getQuickLinks(): Promise<IQuickLinkItem[]> {
        const items = await this.sp.web.lists
            .getByTitle("Corp_QuickLinks")
            .items
            .select("Id", "Title", "DisplayOrder", "RedirectURL", "CoverImage")
            .filter("IsActive eq 1")
            .orderBy("DisplayOrder", true)();

        return items.map(item => {
            let imageUrl: string | undefined;

            if (item.CoverImage) {
                try {
                    const img = JSON.parse(item.CoverImage);
                    imageUrl = `${this.siteUrl}/Lists/Corp_QuickLinks/Attachments/${item.Id}/${img.fileName}`;
                } catch {
                    imageUrl = undefined;
                }
            }

            return {
                Id: item.Id,
                Title: item.Title,
                DisplayOrder: item.DisplayOrder,
                RedirectURL: item.RedirectURL,
                ImageUrl: imageUrl
            };
        });
    }

    private async getCurrentUserId(): Promise<number> {

        if (!this.publishingHubUserId) {
            const currentUser = await this.sp.web.currentUser
                .select("Email")();
            const ensuredUser = await this.publishingHubSp.web.ensureUser(currentUser.Email);
            this.publishingHubUserId = ensuredUser.Id;
        }

        return this.publishingHubUserId;
    }

    private async getTaxonomyLabelByWssId(wssId: number): Promise<string> {
        if (!wssId) return "";

        try {
            const items = await this.publishingHubSp.web.lists
                .getByTitle("TaxonomyHiddenList")
                .items
                .filter(`ID eq ${wssId}`)
                .select("Id", "Term")();

            return items.length > 0 ? items[0].Title : "";
        } catch (error) {
            console.error("Something went wrong. Please contact administrator.");
            return "";
        }
    }

    public async getCorporateNews(): Promise<ICorporateNewsItem[]> {

        const filterQuery =
            `Created ge datetime'2024-08-01T00:00:00Z' and CommunicationType eq 'News' and Status eq 'Published' and PublishIn eq 'Corporate'`;


        const items = await this.publishingHubSp.web.lists
            .getByTitle("CorpCommunication")
            .items
            .select(
                "Id",
                "Title",
                "PublishedDate",
                "LikesCount",
                "Thumbnail",
                "NewsTypes",
                "NewsTypes/Label",
                "LikedBy/Id",
                "AttachmentFiles"
            )
            .expand("AttachmentFiles", "LikedBy")
            .filter(filterQuery)
            .orderBy("PublishedDate", false)
            .top(15)();

        const currentUserId = await this.getCurrentUserId();

        const results = await Promise.all(
            items.map(async (item) => {

                const imageRelativeUrl = this.getThumbnailFromAttachments(
                    item.AttachmentFiles,
                    item.Thumbnail
                );

                const resolvedLabel = await this.getTaxonomyLabelByWssId(
                    item.NewsTypes?.WssId
                );

                const likedUsers = item.LikedBy
                    ? item.LikedBy.map((u: { Id: number }) => u.Id)
                    : [];

                const isLiked = likedUsers.includes(currentUserId);

                return {
                    Id: item.Id,
                    Title: item.Title,
                    PublishedDate: item.PublishedDate,
                    LikesCount: item.LikesCount ? item.LikesCount : 0,
                    ImageUrl: imageRelativeUrl,
                    liked: isLiked,
                    newsType: resolvedLabel
                };
            })
        );

        return results;
    }




    private getThumbnailFromAttachments(
        attachmentFiles: IAttachment[],
        thumbnailFileName: string
    ): string {

        if (!attachmentFiles || attachmentFiles.length === 0) {
            return "";
        }

        // If thumbnail name is available, try to match it
        if (thumbnailFileName) {
            for (let i = 0; i < attachmentFiles.length; i++) {
                if (
                    attachmentFiles[i].FileName &&
                    attachmentFiles[i].FileName.toLowerCase() === thumbnailFileName.toLowerCase()
                ) {
                    return attachmentFiles[i].ServerRelativeUrl;
                }
            }
        }

        // If thumbnail is blank or not found → return first attachment
        return attachmentFiles[0].ServerRelativeUrl;
    }



    public async getEvents(): Promise<ICorporateNewsItem[]> {

        const userGroups = await this.getUserGroups();

        const items = await this.publishingHubSp.web.lists
            .getByTitle("CorpCommunication")
            .items.select(
                "Id",
                "Title",
                "PublishedDate",
                "LikesCount",
                "AttachmentFiles",
                "LikedBy/Id",
                "ThumbnailCaption",
                "DLGroup/Id",
                "DLGroup/Title"
            )
            .expand("AttachmentFiles", "LikedBy", "DLGroup")
            .filter("Created ge datetime'2024-08-01T00:00:00Z' and CommunicationType eq 'Event' and Status eq 'Published'")
            .orderBy("PublishedDate", false)
            .top(15)();

        const currentUserId = await this.getCurrentUserId();

        const filteredItems: any[] = [];

        for (const item of items) {

            if (filteredItems.length === 15) break;

            // If no DLGroup → show to all
            if (!item.DLGroup || item.DLGroup.length === 0) {
                filteredItems.push(item);
                continue;
            }

            let hasAccess = false;

            for (const dl of item.DLGroup) {

                if (!dl) continue;

                // ✅ 1. Check direct user assignment
                if (dl.Id === currentUserId) {
                    hasAccess = true;
                    break;
                }

                // ✅ 2. Check group membership
                if (dl.Title && userGroups.has(dl.Title)) {
                    hasAccess = true;
                    break;
                }
            }

            if (hasAccess) {
                filteredItems.push(item);
            }
        }

        return filteredItems.map(item => {

            const likedUsers = item.LikedBy
                ? item.LikedBy.map((u: { Id: number }) => u.Id)
                : [];

            const isLiked = likedUsers.includes(currentUserId);

            return {
                Id: item.Id,
                Title: item.Title,
                PublishedDate: item.PublishedDate,
                LikesCount: item.LikesCount ?? 0,
                ImageUrl:
                    item.AttachmentFiles && item.AttachmentFiles.length > 0
                        ? item.AttachmentFiles[0].ServerRelativeUrl
                        : "",
                liked: isLiked,
                ThumbnailCaption: item.ThumbnailCaption
            };
        });
    }

    public async getBrands(): Promise<ICorporateNewsItem[]> {
        const items = await this.publishingHubSp.web.lists
            .getByTitle("CorpCommunication")
            .items
            .select(
                "Id",
                "Title",
                "PublishedDate",
                "LikesCount",
                "RelatedSiteURL",
                "AttachmentFiles"
            )
            .expand("AttachmentFiles")
            .filter("Created ge datetime'2024-08-01T00:00:00Z' and CommunicationType eq 'Brand' and Status eq 'Published'")
            .orderBy("PublishedDate", false)
            .top(10)();

        return items.map(item => ({
            Id: item.Id,
            Title: item.Title,
            PublishedDate: item.PublishedDate,
            LikesCount: item.LikesCount || 0,
            RedirectURL: item.RelatedSiteURL,
            ImageUrl:
                item.AttachmentFiles && item.AttachmentFiles.length > 0
                    ? item.AttachmentFiles[0].ServerRelativeUrl
                    : ""
        }));
    }




    public async getBusinessUnits(): Promise<IBusinessUnitItem[]> {
        const items = await this.sp.web.lists
            .getByTitle("Corp_DL_BusinessUnitsCarousel")
            .items
            .select(
                "Id",
                "BUTitle",
                "RedirectURL",
                "FileRef"
            )
            .orderBy("Id", false)
            .top(15)();
        console.log("Business Units Count:", items.length);


        return items.map(item => ({
            Id: item.Id,
            Title: item.BUTitle,
            ImageUrl: item.FileRef,
            RedirectURL: item.RedirectURL
        }));
    }


    public async getVisionMissionValues(): Promise<IVMVItem[]> {

        const items = await this.sp.web.lists
            .getByTitle("Corp_SL_VissionMissionValues")
            .items
            .select(
                "Id",
                "VMVTitle",
                "Category",
                "IsActive",
                "Sequence"
            )
            .filter("IsActive eq 1")
            .orderBy("Sequence", true)
            .top(100)();

        return items
            .map(item => ({
                Id: item.Id,
                Title: item.VMVTitle,
                Category: item.Category,
                Sequence: item.Sequence
            }));

    }

    public async getVMVIcons(): Promise<Map<string, string>> {

        const items = await this.sp.web.lists
            .getByTitle("Corp_DL_VMVIcons")
            .items
            .select(
                "FileRef",
                "VMVCategory"
            )();

        const iconMap = new Map<string, string>();

        items.forEach(item => {
            if (item.VMVCategory && item.FileRef) {

                const key = item.VMVCategory;

                const absoluteUrl = `${window.location.origin}${item.FileRef}`;

                iconMap.set(key, absoluteUrl);
            }
        });

        return iconMap;
    }

    public async getReportItems(): Promise<IReportItem[]> {
        const items = await this.publishingHubSp.web.lists
            .getByTitle("CorpReports")
            .items
            .select(
                "Id",
                "ReportTitle",
                "ReportDescription",
                "CoverImage",
                "AttachmentFiles"
            )
            .expand("AttachmentFiles")
            .orderBy("Id", false)
            .top(15)();

        return items.map(item => {
            let imageUrl = "";
            let fileUrl = "";

            let coverFileName = "";

            // 🔹 Parse CoverImage safely
            if (item.CoverImage) {
                try {
                    const cover = JSON.parse(item.CoverImage);

                    // CASE 1: True Image column (future-safe)
                    if (cover.serverUrl && cover.serverRelativeUrl) {
                        imageUrl = `${cover.serverUrl}${cover.serverRelativeUrl}`;
                    }

                    // CASE 2: Attachment-based image
                    if (cover.fileName) {
                        coverFileName = cover.fileName;
                    }
                } catch (error) {
                    console.error("Something went wrong. Please contact administrator.");
                }
            }

            if (item.AttachmentFiles?.length) {
                // 🔹 Pick PDF (first non-image OR first file)
                const pdf = item.AttachmentFiles.find(
                    (f: IAttachment) => !f.FileName.toLowerCase().endsWith(".jpg") &&
                        !f.FileName.toLowerCase().endsWith(".png")
                ) || item.AttachmentFiles[0];

                fileUrl = pdf.ServerRelativeUrl;

                // 🔹 Resolve image from attachment if needed
                if (!imageUrl && coverFileName) {
                    const img = item.AttachmentFiles.find(
                        (f: IAttachment) => f.FileName === coverFileName
                    );

                    if (img) {
                        imageUrl = img.ServerRelativeUrl;
                    }
                }
            }

            return {
                Id: item.Id,
                Title: item.ReportTitle,
                Description: item.ReportDescription,
                ImageUrl: imageUrl,
                FileUrl: fileUrl
            };
        });
    }

    public async getGovernanceItems(): Promise<IGovernanceItem[]> {
        const items = await this.publishingHubSp.web.lists
            .getByTitle("CorpGovernance")
            .items
            .select(
                "Id",
                "GovernanceTitle",
                "GovernanceDesc",
                "CoverImage",
                "AttachmentFiles"
            )
            .expand("AttachmentFiles")
            .orderBy("Id", false)
            .top(15)();


        return items.map(item => {
            let imageUrl = "";
            let fileUrl = "";

            let coverFileName = "";

            // 🔹 Parse CoverImage safely
            if (item.CoverImage) {
                try {
                    const cover = JSON.parse(item.CoverImage);

                    // CASE 1: True Image column (future-safe)
                    if (cover.serverUrl && cover.serverRelativeUrl) {
                        imageUrl = `${cover.serverUrl}${cover.serverRelativeUrl}`;
                    }

                    // CASE 2: Attachment-based image
                    if (cover.fileName) {
                        coverFileName = cover.fileName;
                    }
                } catch (error) {
                    console.error("Something went wrong. Please contact administrator.");
                }
            }

            if (item.AttachmentFiles?.length) {
                // 🔹 Pick PDF (first non-image OR first file)
                const pdf = item.AttachmentFiles.find(
                    (f: IAttachment) => !f.FileName.toLowerCase().endsWith(".jpg") &&
                        !f.FileName.toLowerCase().endsWith(".png")
                ) || item.AttachmentFiles[0];

                fileUrl = pdf.ServerRelativeUrl;

                // 🔹 Resolve image from attachment if needed
                if (!imageUrl && coverFileName) {
                    const img = item.AttachmentFiles.find(
                        (f: IAttachment) => f.FileName === coverFileName
                    );

                    if (img) {
                        imageUrl = img.ServerRelativeUrl;
                    }
                }
            }

            return {
                Id: item.Id,
                Title: item.GovernanceTitle,
                Description: item.GovernanceDesc,
                ImageUrl: imageUrl,
                FileUrl: fileUrl
            };
        });
    }




    private async getUserGroups(): Promise<Set<string>> {

        const client = await this.context.msGraphClientFactory.getClient("3");

        let requestUrl: string | null = "/me/transitiveMemberOf?$select=displayName";
        const userGroups = new Set<string>();

        while (requestUrl) {

            const response = await client.api(requestUrl).get();

            if (response.value) {
                response.value.forEach((g: { displayName?: string }) => {
                    if (g.displayName) {
                        userGroups.add(g.displayName);
                    }
                });
            }

            requestUrl = response["@odata.nextLink"]
                ? response["@odata.nextLink"].replace("https://graph.microsoft.com/v1.0", "")
                : null;
        }

        return userGroups;
    }


    public async getBroadcasts(): Promise<IBroadcastItem[]> {

        const userGroups = await this.getUserGroups();
        const currentUserId = await this.getCurrentUserId();

        const [items, iconMap] = await Promise.all([

            this.publishingHubSp.web.lists
                .getByTitle("CorpCommunication")
                .items
                .select(
                    "Id",
                    "Title",
                    "PublishedDate",
                    "BroadcastType/Label",
                    "BroadcastType/TermGuid",
                    "DLGroup/Id",
                    "DLGroup/Title"
                )
                .expand("DLGroup")
                .filter(
                    "Created ge datetime'2024-08-01T00:00:00Z' and CommunicationType eq 'BroadCast' and Status eq 'Published'"
                )
                .orderBy("PublishedDate", false)
                .top(100)(),

            this.getBroadcastIcons()
        ]);

        const filteredItems: {
            Id: number;
            Title: string;
            PublishedDate: string;
            BroadcastType?: { Label?: string; TermGuid?: string };
            DLGroup?: { Title?: string }[];
        }[] = [];

        for (const item of items) {

            if (filteredItems.length === 15) break;

            if (!item.DLGroup || item.DLGroup.length === 0) {
                filteredItems.push(item);
                continue;
            }

            let hasAccess = false;

            const dlGroups = Array.isArray(item.DLGroup) ? item.DLGroup : [item.DLGroup];

            for (const dl of dlGroups) {

                if (!dl) continue;

                // ✅ 1. Direct user check
                if (dl.Id === currentUserId) {
                    hasAccess = true;
                    break;
                }

                // ✅ 2. Group check
                if (dl.Title && userGroups.has(dl.Title)) {
                    hasAccess = true;
                    break;
                }
            }

            if (hasAccess) {
                filteredItems.push(item);
            }
        }

        return filteredItems
            .slice(0, 15)
            .map(item => ({
                Id: item.Id,
                Title: item.Title,
                PublishedDate: item.PublishedDate,
                BroadcastType: {
                    Label: item.BroadcastType?.Label || "",
                    TermGuid: (item as any).BroadcastType?.[0].TermGuid || ""
                },
                IconUrl: (item as any).BroadcastType?.[0].TermGuid
                    ? iconMap.get((item as any).BroadcastType?.[0].TermGuid) || ""
                    : ""
            }));
    }

    private async getBroadcastIcons(): Promise<Map<string, string>> {

        const items = await this.publishingHubSp.web.lists
            .getByTitle("BroadCastIcons")
            .items
            .select(
                "FileRef",
                "BroadcastType/TermGuid"
            )();
        const iconMap = new Map<string, string>();

        items.forEach(item => {
            if (item.BroadcastType?.TermGuid) {
                iconMap.set(item.BroadcastType.TermGuid, item.FileRef);
            }
        });

        return iconMap;
    }

    public async toggleLike(
        itemId: number,
        isLiked: boolean
    ): Promise<number> {

        const currentUserId = await this.getCurrentUserId();

        const list = this.publishingHubSp.web.lists.getByTitle("CorpCommunication");
        const itemRef = list.items.getById(itemId);

        const item = await itemRef
            .select("LikedBy/Id")
            .expand("LikedBy")();

        let likedUsers: number[] = item.LikedBy
            ? item.LikedBy.map((u: { Id: number }) => u.Id)
            : [];

        // Remove like
        if (isLiked) {
            likedUsers = likedUsers.filter(id => id !== currentUserId);
        }
        // Add like
        else if (!likedUsers.includes(currentUserId)) {
            likedUsers.push(currentUserId);
        }

        const updatedLikes = likedUsers.length;

        await itemRef.update({
            LikesCount: updatedLikes,
            LikedById: likedUsers
        });

        return updatedLikes;
    }




    public async getAttachments(itemId: number): Promise<IAttachment[]> {
        try {
            return await this.publishingHubSp.web.lists
                .getByTitle("CorpCommunication")
                .items.getById(itemId)
                .attachmentFiles();
        } catch (error) {
            console.error("Something went wrong. Please contact administrator.");
            return [];
        }
    }

    public async getNewsPreviewItem(itemId: number): Promise<INewsPreviewItem | undefined> {
        try {
            const item = await this.publishingHubSp.web.lists
                .getByTitle("CorpCommunication")
                .items
                .getById(itemId)
                .select(
                    "Id",
                    "Title",
                    "PublishedDate",
                    "MainDescription",
                    "NewsTypes",
                    "NewsTypes/Label",
                    "Thumbnail",
                    "Picture1",
                    "Picture2",
                    "Picture3",
                    "ThumbnailCaption",
                    "Pic1Caption",
                    "Pic2Caption",
                    "Pic3Caption"
                )();

            return item;
        } catch (error) {
            console.error("Something went wrong. Please contact administrator.");
            return undefined;
        }
    }

    public async getEventPreviewItem(
        itemId: number
    ): Promise<IEventPreviewItem | undefined> {
        try {
            const item = await this.publishingHubSp.web.lists
                .getByTitle("CorpCommunication")
                .items
                .getById(itemId)
                .select(
                    "Id",
                    "Title",
                    "PublishedDate",
                    "MainDescription",
                    "Thumbnail",
                    "ThumbnailCaption"
                )();

            return item;
        } catch (error) {
            console.error("Something went wrong. Please contact administrator.");
            return undefined;
        }
    }




}
