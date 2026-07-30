/**
 * Tile cache provider abstraction.
 *
 * tile_request_cache 只依赖这个接口，
 * 不关心底层是 Cache API 还是 IndexedDB。
 */

export interface TileCacheProvider {

    /**
     * 获取缓存 tile
     *
     * @param key cache key
     */
    get(key: string): Promise<Response | null>;

    /**
     * 写入缓存 tile
     *
     * @param key cache key
     * @param response tile response
     */
    put(key: string, response: Response): Promise<void>;

    /**
     * 清空缓存
     */
    clear(): Promise<void>;

    /**
     * 限制缓存大小
     *
     * @param limit 最大数量
     */
    enforceLimit(limit: number): Promise<void>;
}
