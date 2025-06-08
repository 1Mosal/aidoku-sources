// sources/olympustaff/source.js
import { Source, Chapter, Manga } from 'aidoku';

export default class OlympusStaff extends Source {
  constructor() {
    super();
    this.id = 'com.olympustaff.en';
    this.baseUrl = 'https://olympustaff.com';
    this.lang = 'en';
    this.nsfw = false;
  }

  async getMangaList(page = 1) {
    const url = page > 1 
      ? `${this.baseUrl}/novels/page/${page}/` 
      : `${this.baseUrl}/novels/`;
    
    const html = await this.requestHTML(url);
    const mangas = [];
    
    for (const item of html.querySelectorAll('.page-listing-item')) {
      const title = item.querySelector('.page-listing-title').text.trim();
      const id = item.querySelector('a').href.split('/').slice(-2, -1)[0];
      const cover = item.querySelector('img').src;
      
      mangas.push(Manga.create({
        id,
        title,
        cover
      }));
    }
    
    const hasNext = html.querySelector('.pagination .next') !== null;
    return { mangas, hasNext };
  }

  async getMangaDetails(mangaId) {
    const url = `${this.baseUrl}/novel/${mangaId}/`;
    const html = await this.requestHTML(url);
    
    const title = html.querySelector('h1.entry-title').text.trim();
    const cover = html.querySelector('.entry-media img').src;
    const author = html.querySelector('.novel-detail .detail-item:contains(Author) .detail-value').text.trim();
    
    let description = '';
    const content = html.querySelector('.entry-content');
    const nodes = content.childNodes;
    
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].tagName === 'H2') break;
      if (nodes[i].tagName === 'P') {
        description += nodes[i].textContent + '\n\n';
      }
    }
    
    return Manga.create({
      id: mangaId,
      title,
      author,
      cover,
      description: description.trim()
    });
  }

  async getChapterList(mangaId) {
    const url = `${this.baseUrl}/novel/${mangaId}/`;
    const html = await this.requestHTML(url);
    const chapters = [];
    
    const list = html.querySelector('.page-content-listing ul');
    if (!list) return chapters;
    
    for (const item of list.querySelectorAll('li')) {
      const link = item.querySelector('a');
      const chapterUrl = link.href;
      const id = chapterUrl.split('/').slice(-2, -1)[0];
      const title = link.text.trim();
      
      chapters.push(Chapter.create({
        id,
        mangaId,
        title,
        lang: 'en'
      }));
    }
    
    return chapters;
  }

  async getChapterText(mangaId, chapterId) {
    const url = `${this.baseUrl}/novel/${mangaId}/${chapterId}/`;
    const html = await this.requestHTML(url);
    const content = html.querySelector('.entry-content');
    
    // Remove unwanted elements
    content.querySelectorAll('.code-block, .nav-previous, .nav-next').forEach(el => el.remove());
    
    // Remove support paragraph
    const paragraphs = content.querySelectorAll('p');
    const last = paragraphs[paragraphs.length - 1];
    if (last.textContent.includes('Support Olympus Staff')) {
      last.remove();
    }
    
    return content.innerHTML;
  }
}
