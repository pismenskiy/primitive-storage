import AbstractPersistentStorage from '../../../main/ts/storage/abstractPersistentStorage'
import InMemoryStorage from '../../../main/ts/storage/inMemoryStorage'
import {IStorageOpts} from '../../../main/ts/interface'

const stringify = AbstractPersistentStorage.stringify.bind(
  AbstractPersistentStorage,
)

class TestAbstractPersistentStorage extends AbstractPersistentStorage {}

const testAbstractPersistentStorage = new TestAbstractPersistentStorage({})

const write = testAbstractPersistentStorage.io.write
const read = testAbstractPersistentStorage.io.read
const {parse} = AbstractPersistentStorage

describe('storage/abstractPersistent', () => {
  describe('constructor', () => {
    class Storage extends AbstractPersistentStorage {

      constructor(opts: IStorageOpts) {
        super(opts)
      }

      io = {
        write: (path: string, data: string) => {
          throw new Error('test write')
        },

        read: (path: string) => {
          throw new Error('test read')
        },
      }

      syncFrom() {}

    }

    it('returns proper instance', () => {
      const storage = new Storage({})
      expect(storage.cache).toBeInstanceOf(InMemoryStorage)
    })

    it('supports `debounce` opts', () => {
      const storage1 = new Storage({path: 'foo'})
      const storage2 = new Storage({
        path: 'foo',
        debounce: {delay: 500, maxDelay: 1000},
      })

      expect(storage1.syncTo).toBe(Storage.prototype.syncTo)
      expect(storage2.syncTo).not.toBe(Storage.prototype.syncTo)
    })
  })

  describe('proto', () => {
    describe('sync', () => {
      let persisted = 'qux'

      class Storage extends AbstractPersistentStorage {

        constructor(opts: IStorageOpts) {
          super(opts)
          this.io = {
            read: (path: string) => {
              return 'read' + path + persisted
            },

            write: (path: string, data: string) => {
              persisted = 'write' + path + data
            },
          }
        }

        static stringify(data: string) {
          return 'stringified' + data
        }

        static parse(data: string) {
          return 'parsed' + data
        }

      }

      const path = 'foo'
      const storage = new Storage({path})

      it('`syncFrom` composes `read` and `parse`', () => {
        storage.syncFrom()
        expect(storage.cache.data).toBe('parsedreadfooqux')
      })

      it('`syncTo` composes `stringify` and `write`', () => {
        // @ts-ignore
        storage.cache.data = 'bar'
        storage.syncTo()

        expect(persisted).toBe('writefoostringifiedbar')
      })
    })

    describe('IStorage methods', () => {
      class Storage extends AbstractPersistentStorage {

        constructor(opts: any) {
          super(opts)
          this.io = {
            write: () => {
              console.log('123')
            },

            read: () => {
              return '{"foo": {"value": "bar"}}'
            },
          }
        }

      }

      const storage = new Storage({path: 'qux'})
      const syncTo = jest.spyOn(storage, 'syncTo')
      const syncFrom = jest.spyOn(storage, 'syncFrom')

      beforeEach(() => {
        syncFrom.mockClear()
        syncTo.mockClear()
      })

      it('`get` returns value from cache', () => {
        expect(storage.get('foo')).toBe('bar')
        expect(syncTo).not.toHaveBeenCalled()
      })

      it('`set` adds value to cache and triggers `syncTo`', () => {
        expect(storage.set('bar', 'qux')).toBeUndefined()
        expect(syncTo).toHaveBeenCalled()
      })

      it('`remove` deletes target key and triggers `syncTo`', () => {
        expect(storage.remove('bar')).toBeUndefined()
        expect(syncTo).toHaveBeenCalled()
      })

      it('`reset` flushes cache and triggers `syncTo`', () => {
        expect(storage.reset()).toBeUndefined()
        expect(syncTo).toHaveBeenCalled()
      })

      it('`size` returns the count of non-expired cached entries', () => {
        storage.cache.data = {
          foo: {value: 'bar', exp: Infinity},
          baz: {value: 'qux', exp: 0},
        }

        expect(storage.size()).toBe(1)
      })

      it('`compact` throws away expired entries ant triggers `syncTo`', () => {
        expect(storage.compact()).toBeUndefined()
        expect(syncTo).toHaveBeenCalled()
      })
    })
  })

  describe('static', () => {
    describe('stringify', () => {
      it('transforms object to JSON string', () => {
        expect(stringify({foo: 'bar'})).toEqual('{"foo":"bar"}')
      })

      it('catches cycled refs', () => {
        const foo = {bar: 'baz'}
        // @ts-ignore
        foo.foo = foo

        expect(stringify(foo)).toEqual('{"bar":"baz","foo":"<cycled>"}')
      })
    })

    describe('parse', () => {
      it('parses JSON string', () => {
        expect(parse('{"foo":"bar"}')).toEqual({foo: 'bar'})
      })
    })
  })
})
