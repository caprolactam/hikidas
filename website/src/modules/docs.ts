import { getCollection } from 'astro:content'

interface MenuItemAttributes {
  title: string
  order?: number
}

export type DocsMenuItem =
  | {
      attributes: MenuItemAttributes
      children: DocsMenuItem[]
      url: string
    }
  | {
      attributes: MenuItemAttributes
      children: DocsMenuItem[]
      url?: never
    }

export async function getDocsMenu(): Promise<DocsMenuItem[]> {
  const docs = await getCollection('docs')

  // ツリー構造を構築するヘルパー関数
  function buildTree(entries: typeof docs): DocsMenuItem[] {
    const tree: DocsMenuItem[] = []
    const pathMap = new Map<string, DocsMenuItem>()

    // すべてのIDを収集してディレクトリを判定
    const allIds = new Set(entries.map((e) => e.id))

    // IDがディレクトリインデックスかどうかを判定
    // 他のIDのプレフィックスになっている場合、ディレクトリインデックス
    function isDirectoryIndex(id: string): boolean {
      return Array.from(allIds).some(
        (otherId) => otherId !== id && otherId.startsWith(id + '/'),
      )
    }

    // まず、ディレクトリインデックスを処理
    entries.forEach((entry) => {
      if (isDirectoryIndex(entry.id)) {
        const menuItem: DocsMenuItem = {
          attributes: {
            title: entry.data.title,
            order: entry.data.order,
          },
          children: [],
        }

        pathMap.set(entry.id, menuItem)
      }
    })

    // ディレクトリをツリーに配置
    pathMap.forEach((item, path) => {
      const parts = path.split('/')
      if (parts.length === 1) {
        // トップレベル
        tree.push(item)
      } else {
        // ネストされたディレクトリ
        const parentPath = parts.slice(0, -1).join('/')
        const parent = pathMap.get(parentPath)
        if (parent) {
          parent.children.push(item)
        }
      }
    })

    // 次に、通常のドキュメントファイルを処理
    entries.forEach((entry) => {
      if (!isDirectoryIndex(entry.id)) {
        // 通常のドキュメントファイル
        const parts = entry.id.split('/')
        const dirPath = parts.slice(0, -1).join('/')
        const parent = dirPath ? pathMap.get(dirPath) : null

        const menuItem: DocsMenuItem = {
          attributes: {
            title: entry.data.title,
            order: entry.data.order,
          },
          children: [],
          url: `/${entry.id}`,
        }

        if (parent) {
          parent.children.push(menuItem)
        } else if (dirPath === '') {
          tree.push(menuItem)
        }
      }
    })

    // すべてのサブツリーをソート
    function sortTree(items: DocsMenuItem[]) {
      items.sort(
        (a, b) => (a.attributes.order ?? 999) - (b.attributes.order ?? 999),
      )
      items.forEach((item) => {
        if (item.children.length > 0) {
          sortTree(item.children)
        }
      })
    }

    sortTree(tree)
    return tree
  }

  return buildTree(docs)
}
