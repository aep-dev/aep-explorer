class ResourceInstance {
  id: string
  path: string
  properties: object

  constructor(id: string, path: string, properties: object) {
    this.id = id;
    this.path = path;
    this.properties = properties;
  }
}

async function List(url: string): Promise<ResourceInstance[]> {
    let response = await fetch(url);
    const results: ResourceInstance[] = [];
    const list_response = await response.json();
    for(const result of list_response.results) {
        results.push(new ResourceInstance(result['id'], result['path'], result));
    }
    return results;
}

export {ResourceInstance, List}
