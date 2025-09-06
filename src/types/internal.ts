export interface Grid {
    id: string;
    name: string;
    posts: Post[];
};

export interface Post {
    id: string;
    url: string;
    order: number;
};