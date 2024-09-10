class AzureSearchQuery {
    search: string = '';
    searchMode: string = 'all';
    searchFields: string = '';
    filter: string = '';
    queryType: string = 'full';
    top: number = 50; // Number of results ***
    skip: number = 0; // Can be used for paging
    count: boolean = true;
}

type AzureSearchResult = {
    '@search.score': number,
    batch_num: string,
    document_id: string,
    file_name: string,
    file_path: string,
    file_type: string,
    file_last_update: string,
    folder: string,
    group: string,
    groups: string[],
    img_captions: string[],
    img_description_tags: string[],
    img_tags: string[],
    key_phrases: string[],
    metadata_storage_path: string,
    original_lang: string,
    summarized_text_dailymail: string,
    summarized_text_xsum: string,
    text_content: string,
    text_content_target_lang: string,
    uploaded_by: string,
    upload_date: string,
    video_keywords: string[],
    video_labels: string[],
    video_transcripts: any[]
}

type IkmFile = {
    score: number,
    name: string,
    path: string,
    type: string,
    lastUpdate: string,
    group: string,
    groups: string[],
    phrases: string[],
    metadataPath: string,
    content: string,
    uploadedBy: string,
    uploadDate: string,
    summarized_text_dailymail: string,
    summarized_text_xsum: string
}

export {
    type AzureSearchResult,
    type IkmFile,
    AzureSearchQuery
}
