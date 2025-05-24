/**
 * Search Service for NosytLabs
 * Provides comprehensive search functionality across the website
 */

// Search configuration
const SEARCH_CONFIG = {
  // Minimum query length
  minQueryLength: 2,
  
  // Maximum results per category
  maxResults: 10,
  
  // Search weights for different content types
  weights: {
    title: 3,
    heading: 2,
    content: 1,
    tags: 2,
    description: 1.5
  },
  
  // Debounce delay for search input
  debounceDelay: 300
};

// Search index structure
class SearchIndex {
  constructor() {
    this.index = new Map();
    this.documents = new Map();
    this.categories = new Set();
    this.initialized = false;
  }

  // Add document to search index
  addDocument(doc) {
    const id = doc.id || this.generateId();
    this.documents.set(id, doc);
    this.categories.add(doc.category);
    
    // Index all searchable fields
    const searchableText = this.extractSearchableText(doc);
    const tokens = this.tokenize(searchableText);
    
    tokens.forEach(token => {
      if (!this.index.has(token)) {
        this.index.set(token, new Set());
      }
      this.index.get(token).add(id);
    });
    
    return id;
  }

  // Extract searchable text from document
  extractSearchableText(doc) {
    const fields = [];
    
    // Add title with higher weight
    if (doc.title) {
      for (let i = 0; i < SEARCH_CONFIG.weights.title; i++) {
        fields.push(doc.title);
      }
    }
    
    // Add headings with medium weight
    if (doc.headings) {
      doc.headings.forEach(heading => {
        for (let i = 0; i < SEARCH_CONFIG.weights.heading; i++) {
          fields.push(heading);
        }
      });
    }
    
    // Add description with medium weight
    if (doc.description) {
      for (let i = 0; i < SEARCH_CONFIG.weights.description; i++) {
        fields.push(doc.description);
      }
    }
    
    // Add tags with medium weight
    if (doc.tags) {
      doc.tags.forEach(tag => {
        for (let i = 0; i < SEARCH_CONFIG.weights.tags; i++) {
          fields.push(tag);
        }
      });
    }
    
    // Add content with normal weight
    if (doc.content) {
      fields.push(doc.content);
    }
    
    return fields.join(' ');
  }

  // Tokenize text for indexing
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length >= 2)
      .filter(token => !this.isStopWord(token));
  }

  // Check if word is a stop word
  isStopWord(word) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ]);
    return stopWords.has(word);
  }

  // Search the index
  search(query, options = {}) {
    if (query.length < SEARCH_CONFIG.minQueryLength) {
      return [];
    }

    const tokens = this.tokenize(query);
    const scores = new Map();
    
    // Find documents containing search terms
    tokens.forEach(token => {
      // Exact matches
      if (this.index.has(token)) {
        this.index.get(token).forEach(docId => {
          scores.set(docId, (scores.get(docId) || 0) + 1);
        });
      }
      
      // Partial matches (prefix search)
      this.index.forEach((docIds, indexToken) => {
        if (indexToken.startsWith(token) && indexToken !== token) {
          docIds.forEach(docId => {
            scores.set(docId, (scores.get(docId) || 0) + 0.5);
          });
        }
      });
    });

    // Convert to results array with documents
    const results = Array.from(scores.entries())
      .map(([docId, score]) => ({
        document: this.documents.get(docId),
        score,
        relevance: score / tokens.length
      }))
      .filter(result => result.document)
      .sort((a, b) => b.score - a.score);

    // Apply category filter if specified
    if (options.category) {
      return results.filter(result => result.document.category === options.category);
    }

    return results;
  }

  // Get all categories
  getCategories() {
    return Array.from(this.categories);
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Main search service
class SearchService {
  constructor() {
    this.index = new SearchIndex();
    this.initialized = false;
  }

  // Initialize search index with website content
  async initialize() {
    if (this.initialized) return;

    try {
      // Index static content
      await this.indexStaticContent();
      
      // Index blog posts
      await this.indexBlogPosts();
      
      // Index projects
      await this.indexProjects();
      
      // Index services
      await this.indexServices();
      
      this.initialized = true;
      console.log('🔍 Search index initialized with', this.index.documents.size, 'documents');
      
    } catch (error) {
      console.error('Failed to initialize search index:', error);
    }
  }

  // Index static pages
  async indexStaticContent() {
    const staticPages = [
      {
        id: 'home',
        title: 'NosytLabs - Notable Opportunities Shape Your Tomorrow',
        description: 'Innovative digital solutions, web development, 3D printing, and content creation services.',
        content: 'NosytLabs portfolio website showcasing web development, 3D printing services, content creation, and passive income resources. Founded in 2025.',
        url: '/',
        category: 'page',
        tags: ['portfolio', 'web development', '3d printing', 'content creation']
      },
      {
        id: 'about',
        title: 'About NosytLabs',
        description: 'Learn about our story, mission, and the journey behind Notable Opportunities Shape Your Tomorrow.',
        content: 'Founded in 2025, NosytLabs is dedicated to creating innovative digital solutions. We specialize in web development, 3D printing, and content creation.',
        url: '/about',
        category: 'page',
        tags: ['about', 'company', 'story', 'mission']
      },
      {
        id: 'services',
        title: 'Our Services',
        description: 'Web development, 3D printing, content creation, and consultation services.',
        content: 'Professional web development with modern frameworks, 3D printing services with FDM and resin printers, content creation for YouTube and Kick.',
        url: '/services',
        category: 'page',
        tags: ['services', 'web development', '3d printing', 'consultation']
      },
      {
        id: 'contact',
        title: 'Contact NosytLabs',
        description: 'Get in touch with us for your next project or collaboration.',
        content: 'Contact form, email, and social media links to reach NosytLabs team.',
        url: '/contact',
        category: 'page',
        tags: ['contact', 'email', 'collaboration']
      },
      {
        id: 'nosytos95',
        title: 'NosytOS95 - Windows 95 Interface',
        description: 'Experience our unique Windows 95-inspired interface with working applications and games.',
        content: 'Interactive Windows 95 interface featuring Duck Hunt, Minesweeper, Notepad, Terminal, and AI Assistant.',
        url: '/nosytos95',
        category: 'feature',
        tags: ['windows 95', 'games', 'interface', 'retro', 'duck hunt', 'minesweeper']
      },
      {
        id: 'passive-income',
        title: 'Passive Income Resources',
        description: 'Comprehensive guide to passive income applications with real earnings data.',
        content: 'Detailed reviews and earnings data for passive income apps including Honeygain, EarnApp, Peer2Profit, and more.',
        url: '/passive-income',
        category: 'resource',
        tags: ['passive income', 'earnings', 'apps', 'money', 'side hustle']
      }
    ];

    staticPages.forEach(page => this.index.addDocument(page));
  }

  // Index blog posts
  async indexBlogPosts() {
    try {
      // Try to fetch blog posts data
      const response = await fetch('/data/blog-posts.json');
      if (response.ok) {
        const blogPosts = await response.json();
        blogPosts.forEach(post => {
          this.index.addDocument({
            id: `blog-${post.slug}`,
            title: post.title,
            description: post.excerpt || post.description,
            content: post.content || '',
            url: `/blog/${post.slug}`,
            category: 'blog',
            tags: post.tags || [],
            date: post.date,
            author: post.author
          });
        });
      }
    } catch (error) {
      // Fallback to manual blog post indexing
      const blogPosts = [
        {
          id: 'blog-cursor-ai',
          title: 'Cursor AI Review - Revolutionizing Code Development',
          description: 'Comprehensive review of Cursor AI and its impact on modern development workflows.',
          content: 'Cursor AI is transforming how developers write code with intelligent suggestions and automation.',
          url: '/blog/cursor-ai',
          category: 'blog',
          tags: ['ai', 'development', 'tools', 'cursor', 'coding']
        },
        {
          id: 'blog-trae-ai',
          title: 'Trae AI - Adaptive Coding Assistant',
          description: 'In-depth look at Trae AI and its adaptive coding capabilities.',
          content: 'Trae AI offers adaptive coding assistance with intelligent code completion and suggestions.',
          url: '/blog/trae-ai',
          category: 'blog',
          tags: ['ai', 'coding', 'assistant', 'trae', 'development']
        },
        {
          id: 'blog-windsurf',
          title: 'Windsurf - Navigating Large Codebases',
          description: 'How Windsurf helps developers navigate and understand large codebases.',
          content: 'Windsurf provides powerful tools for understanding and navigating complex code structures.',
          url: '/blog/windsurf',
          category: 'blog',
          tags: ['development', 'tools', 'codebase', 'navigation', 'windsurf']
        }
      ];

      blogPosts.forEach(post => this.index.addDocument(post));
    }
  }

  // Index projects
  async indexProjects() {
    try {
      const response = await fetch('/data/projects.json');
      if (response.ok) {
        const projects = await response.json();
        projects.forEach(project => {
          this.index.addDocument({
            id: `project-${project.slug || project.id}`,
            title: project.title || project.name,
            description: project.description,
            content: project.longDescription || project.content || '',
            url: project.url || `/projects#${project.slug}`,
            category: 'project',
            tags: project.technologies || project.tags || [],
            type: project.type
          });
        });
      }
    } catch (error) {
      // Fallback projects
      const projects = [
        {
          id: 'project-nosytlabs-website',
          title: 'NosytLabs Portfolio Website',
          description: 'Modern portfolio website built with Astro.js featuring Windows 95 interface.',
          content: 'Full-stack portfolio website with interactive games, 3D printing integration, and comprehensive content management.',
          url: '/projects',
          category: 'project',
          tags: ['astro', 'javascript', 'portfolio', 'web development']
        },
        {
          id: 'project-3d-printing',
          title: '3D Printing Services',
          description: 'Professional 3D printing with FDM and resin technologies.',
          content: 'Custom 3D printing services using Creality Ender 3 S1 Pro and Elegoo Saturn 2 printers.',
          url: '/3d-printing',
          category: 'project',
          tags: ['3d printing', 'fdm', 'resin', 'manufacturing']
        }
      ];

      projects.forEach(project => this.index.addDocument(project));
    }
  }

  // Index services
  async indexServices() {
    const services = [
      {
        id: 'service-web-development',
        title: 'Web Development Services',
        description: 'Custom web development with modern frameworks and technologies.',
        content: 'Full-stack web development using React, Astro, Node.js, and modern deployment practices.',
        url: '/services#web-development',
        category: 'service',
        tags: ['web development', 'react', 'astro', 'javascript', 'frontend', 'backend']
      },
      {
        id: 'service-3d-printing',
        title: '3D Printing Services',
        description: 'Professional 3D printing and prototyping services.',
        content: 'High-quality 3D printing using FDM and resin technologies for prototypes and custom parts.',
        url: '/services#3d-printing',
        category: 'service',
        tags: ['3d printing', 'prototyping', 'manufacturing', 'fdm', 'resin']
      },
      {
        id: 'service-content-creation',
        title: 'Content Creation',
        description: 'Video content creation for YouTube and live streaming.',
        content: 'Professional content creation including video editing, live streaming, and educational content.',
        url: '/services#content-creation',
        category: 'service',
        tags: ['content creation', 'youtube', 'streaming', 'video editing']
      }
    ];

    services.forEach(service => this.index.addDocument(service));
  }

  // Perform search
  async search(query, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const results = this.index.search(query, options);
    
    // Group results by category
    const groupedResults = {};
    results.forEach(result => {
      const category = result.document.category;
      if (!groupedResults[category]) {
        groupedResults[category] = [];
      }
      if (groupedResults[category].length < SEARCH_CONFIG.maxResults) {
        groupedResults[category].push(result);
      }
    });

    return {
      query,
      total: results.length,
      categories: groupedResults,
      suggestions: this.generateSuggestions(query, results)
    };
  }

  // Generate search suggestions
  generateSuggestions(query, results) {
    const suggestions = new Set();
    
    // Add popular tags from results
    results.slice(0, 5).forEach(result => {
      if (result.document.tags) {
        result.document.tags.forEach(tag => {
          if (tag.toLowerCase().includes(query.toLowerCase()) || 
              query.toLowerCase().includes(tag.toLowerCase())) {
            suggestions.add(tag);
          }
        });
      }
    });

    // Add category-based suggestions
    const categories = this.index.getCategories();
    categories.forEach(category => {
      if (category.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(category);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }

  // Get popular searches (placeholder for analytics)
  getPopularSearches() {
    return [
      'web development',
      '3d printing',
      'cursor ai',
      'passive income',
      'duck hunt',
      'nosytos95',
      'services',
      'contact'
    ];
  }

  // Get search categories
  getCategories() {
    return this.index.getCategories();
  }
}

// Create global search service instance
const searchService = new SearchService();

export default searchService;

// Client-side search utilities
export const searchUtils = {
  // Debounced search function
  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },

  // Highlight search terms in text
  highlightSearchTerms(text, query) {
    if (!query || !text) return text;
    
    const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
    let highlightedText = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
  },

  // Format search results for display
  formatResults(results) {
    return Object.entries(results.categories).map(([category, items]) => ({
      category: this.formatCategoryName(category),
      items: items.map(item => ({
        ...item.document,
        relevance: item.relevance,
        score: item.score
      }))
    }));
  },

  // Format category names for display
  formatCategoryName(category) {
    const categoryNames = {
      'page': 'Pages',
      'blog': 'Blog Posts',
      'project': 'Projects',
      'service': 'Services',
      'feature': 'Features',
      'resource': 'Resources'
    };
    
    return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
  },

  // Get category icon
  getCategoryIcon(category) {
    const icons = {
      'page': '📄',
      'blog': '📝',
      'project': '🚀',
      'service': '⚙️',
      'feature': '✨',
      'resource': '📚'
    };
    
    return icons[category] || '📄';
  }
};
