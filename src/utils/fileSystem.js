/**
 * File System & Drag/Drop Directory Traversal Utility
 * Recursively extracts files from dropped folders with relative paths.
 */

/**
 * File System Access API recursive directory reader
 * Accurately extracts nested files and preserves empty directories.
 */
export async function readDirectoryHandle(dirHandle, path = '') {
  const currentPath = path ? `${path}/${dirHandle.name}` : dirHandle.name;
  const files = [];
  let hasEntries = false;

  for await (const entry of dirHandle.values()) {
    hasEntries = true;
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      Object.defineProperty(file, 'webkitRelativePath', {
        value: `${currentPath}/${file.name}`,
        writable: false
      });
      files.push(file);
    } else if (entry.kind === 'directory') {
      const nested = await readDirectoryHandle(entry, currentPath);
      files.push(...nested);
    }
  }

  // If this directory had no entries at all, record directory placeholder so it gets created in Google Drive
  if (!hasEntries) {
    files.push({
      name: dirHandle.name,
      webkitRelativePath: `${currentPath}/_dir_marker_`,
      isDirectoryPlaceholder: true,
      size: 0
    });
  }

  return files;
}

export async function extractFilesFromDataTransfer(dataTransfer) {
  const files = [];

  // If DataTransferItemList is available, use webkitGetAsEntry for recursive folder support
  if (dataTransfer.items && dataTransfer.items.length > 0) {
    const entries = [];
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry) entries.push(entry);
      }
    }

    if (entries.length > 0) {
      for (const entry of entries) {
        await traverseEntry(entry, '', files);
      }
      return files;
    }
  }

  // Fallback to standard FileList
  return Array.from(dataTransfer.files || []);
}

async function traverseEntry(entry, path, resultList) {
  if (entry.isFile) {
    const file = await new Promise((resolve) => entry.file(resolve));
    // Assign relative path
    Object.defineProperty(file, 'webkitRelativePath', {
      value: path ? `${path}/${file.name}` : file.name,
      writable: false
    });
    resultList.push(file);
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();
    const currentPath = path ? `${path}/${entry.name}` : entry.name;
    let hasChildren = false;

    const readAllEntries = async () => {
      const entries = await new Promise((resolve) => dirReader.readEntries(resolve, () => resolve([])));
      if (entries.length > 0) {
        hasChildren = true;
        for (const child of entries) {
          await traverseEntry(child, currentPath, resultList);
        }
        await readAllEntries(); // Continue reading until empty (as required by API)
      }
    };

    await readAllEntries();

    // If directory had no files, record an empty directory placeholder so the directory is created
    if (!hasChildren) {
      resultList.push({
        name: entry.name,
        webkitRelativePath: `${currentPath}/_dir_marker_`,
        isDirectoryPlaceholder: true,
        size: 0
      });
    }
  }
}

