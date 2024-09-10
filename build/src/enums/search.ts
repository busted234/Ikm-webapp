export enum SearchInfo {
    SearchHeader = 'What are you looking for?'
}

export enum SearchResults {
    Filters = 'Filters',
    Group = 'Group',
    Files = 'Files',
    Folders = 'Folders',
    FileTypes = 'File Types',
    Searching = 'Searching ...',
    ViewDetails = 'ViewDetails',
    Download = 'Download',
    RequestAccess = 'Request Access',
    ShortSummary = 'Short Summary',
    Tags = 'Tags'
}

export enum FileResults {
    BackToSearch = 'Back to Search',
    Download = 'Download',
    ShortSummary = 'Short Summary',
    LongSummary = 'Long Summary',
    RequestEdits = 'Request Edits',
    Tags = 'Tags',
    KeyPhrases = 'Key Phrases'
}

export const FileTypes = [
    'Word Document',
    'Powerpoint',
    'Excel',
    'PDF',
    'JPEG'
]

export const RequestEditTypes = [
    'Update Document',
    'Delete Document'
]
