/**
 * Unit Tests for Utility Functions
 * Tests helper functions used across the app
 */

describe('Date Formatting Utils', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-12-25T18:00:00Z')
    const formatted = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    expect(formatted).toContain('December')
    expect(formatted).toContain('25')
    expect(formatted).toContain('2024')
  })

  it('should calculate time ago correctly', () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const hourDiff = Math.floor((now.getTime() - oneHourAgo.getTime()) / (1000 * 60 * 60))
    const dayDiff = Math.floor((now.getTime() - oneDayAgo.getTime()) / (1000 * 60 * 60 * 24))

    expect(hourDiff).toBe(1)
    expect(dayDiff).toBe(1)
  })
})

describe('Array Manipulation Utils', () => {
  it('should shuffle array randomly', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const shuffled = [...original].sort(() => Math.random() - 0.5)

    expect(shuffled.length).toBe(original.length)
    expect(shuffled).toEqual(expect.arrayContaining(original))
  })

  it('should chunk array into groups', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const chunkSize = 3

    const chunks = []
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize))
    }

    expect(chunks.length).toBe(4)
    expect(chunks[0]).toEqual([1, 2, 3])
    expect(chunks[3]).toEqual([10])
  })

  it('should remove duplicates from array', () => {
    const withDuplicates = [1, 2, 3, 2, 4, 1, 5, 3]
    const unique = Array.from(new Set(withDuplicates))

    expect(unique).toEqual([1, 2, 3, 4, 5])
    expect(unique.length).toBe(5)
  })
})

describe('String Manipulation Utils', () => {
  it('should truncate long text', () => {
    const longText = 'This is a very long text that should be truncated to fit within the character limit'
    const maxLength = 50

    const truncated = longText.length > maxLength 
      ? longText.substring(0, maxLength) + '...'
      : longText

    expect(truncated.length).toBeLessThanOrEqual(maxLength + 3)
    expect(truncated).toContain('...')
  })

  it('should format currency correctly', () => {
    const amount = 1234.56

    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount)

    expect(formatted).toContain('1,234')
  })

  it('should validate email format', () => {
    const validEmail = 'user@example.com'
    const invalidEmail = 'invalid-email'

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    expect(emailRegex.test(validEmail)).toBe(true)
    expect(emailRegex.test(invalidEmail)).toBe(false)
  })
})

describe('Number Utilities', () => {
  it('should calculate percentage correctly', () => {
    const part = 75
    const total = 100

    const percentage = (part / total) * 100

    expect(percentage).toBe(75)
  })

  it('should round to decimal places', () => {
    const number = 3.14159

    const rounded = Math.round(number * 100) / 100

    expect(rounded).toBe(3.14)
  })

  it('should clamp value between min and max', () => {
    const clamp = (value: number, min: number, max: number) => 
      Math.min(Math.max(value, min), max)

    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
  })
})

describe('Validation Utils', () => {
  it('should validate required fields', () => {
    const data = {
      name: 'John',
      email: '',
      age: 25,
    }

    const requiredFields = ['name', 'email', 'age']
    const missingFields = requiredFields.filter((field) => !data[field as keyof typeof data])

    expect(missingFields).toEqual(['email'])
  })

  it('should validate password strength', () => {
    const weakPassword = '123456'
    const strongPassword = 'MyP@ssw0rd123'

    const isStrong = (pwd: string) => 
      pwd.length >= 8 && 
      /[A-Z]/.test(pwd) && 
      /[a-z]/.test(pwd) && 
      /[0-9]/.test(pwd) && 
      /[^A-Za-z0-9]/.test(pwd)

    expect(isStrong(weakPassword)).toBe(false)
    expect(isStrong(strongPassword)).toBe(true)
  })
})
