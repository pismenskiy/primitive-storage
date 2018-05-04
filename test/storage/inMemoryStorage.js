import InMemoryStorage from '../../src/storage/inMemoryStorage'

const {getExpirationDate} = InMemoryStorage

describe('storage/in-memory', () => {
  describe('constructor', () => {
    it('returns proper instance', () => {
      const opts = {}
      const storage = new InMemoryStorage(opts)

      expect(storage.opts).toBe(opts)
      expect(storage).toBeInstanceOf(InMemoryStorage)
    })
  })

  describe('static', () => {
    describe('getExpirationDate', () => {
      it('appends ttl to Date.now()', () => {
        expect(getExpirationDate(100)).toBe(100 + Date.now())
      })

      it('returns null otherwise', () => {
        expect(getExpirationDate()).toBeNull()
      })
    })
  })

  describe('proto', () => {
    const storage = new InMemoryStorage()

    describe('set', () => {
      it('associates value w/ key', () => {
        storage.set('foo', 'bar')
        expect(storage.get('foo')).toBe('bar')
        expect(storage.data).toEqual({
          foo: {
            value: 'bar',
            exp: null
          }
        })
      })

      it('value with ttl', done => {
        storage.set('baz', 'qux', 5)
        setTimeout(() => {
          expect(storage.get('baz')).toBeUndefined()
          done()
        }, 5)
      })
    })

    describe('get', () => {
      it('resolves value by key', () => {
        storage.set('foo', 'bar')
        expect(storage.get('foo')).toBe('bar')
      })

      it('returns undefined otherwise', () => {
        expect(storage.get('foofoo')).toBeUndefined()
      })
    })

    describe('remove', () => {
      it('drops entry', () => {
        storage.set('foo', 'bar')
        storage.remove('foo')
        expect(storage.get('foo')).toBeUndefined()
      })
    })

    describe('reset', () => {
      it('flushes the storage', () => {
        storage.set('foo', 'bar')
        storage.reset()
        expect(storage.get('foo')).toBeUndefined()
        expect(storage.data).toEqual({})
      })
    })
  })
})
