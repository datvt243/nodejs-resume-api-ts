export interface socialMedia {
    github?: string;
    linkedin?: string;
    website?: string;
}

export interface informationPersonal extends socialMedia {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
    introduction: string;
}

export interface Item {
    title: string;
    subTitle: string;
    startDate: number;
    endDate: number;
    isCurrent: boolean;
    description: string;
    skills?: string[];
}

export interface Skill {
    name: string;
    exp?: number;
    group?: string;
}

export interface Language {
    language: string;
    level: string;
}
