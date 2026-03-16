import changelogData from './changelog.json';

export type ChangelogEntry = {
  day: number;
  date: string;
  title: string;
  summary: string;
  links?: { label: string; href: string }[];
};

export const changelog: ChangelogEntry[] = changelogData as ChangelogEntry[];
export default changelog;
