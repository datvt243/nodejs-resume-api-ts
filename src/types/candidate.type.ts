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
    endDate: number | null;
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

export interface Reference {
    fullName: string;
    phone: string;
    company: string;
    position: string;
}

export interface Certificate {
    name: string;
    organization: string;
    description?: string;
    startDate: number;
    endDate: number;
    isNoExpiration: boolean;
    link?: string;
    images?: string[];
}

export interface Award {
    name: string;
    organization: string;
    issueDate: number;
    link?: string;
    images?: string[];
    description?: string;
}
