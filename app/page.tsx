'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Film, Star, Users, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { getTMDBImageUrl } from '@/lib/tmdb/client'
import { TMDBMovie } from '@/types/tmdb.types'

const features = [
  {
    icon: Film,
    title: 'Extensive Movie Database',
    description: 'Access thousands of movies with detailed information and high-quality posters.',
    link: '/dashboard'
  },
  {
    icon: Star,
    title: 'Rate & Review',
    description: 'Share your thoughts and ratings with the community. Your voice matters.',
    link: '/dashboard'
  },
]

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [movies, setMovies] = useState<TMDBMovie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMovies()
  }, [])

  const loadMovies = async () => {
    try {
      const response = await fetch('/api/movies/trending')
      if (!response.ok) {
        throw new Error('Failed to fetch movies')
      }
      const data = await response.json()
      setMovies(data.results.slice(0, 5))
    } catch (error) {
      console.error('Failed to load movies:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (movies.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % movies.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [movies.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % movies.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + movies.length) % movies.length)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Film className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">CineVerse</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-2">
            {/* Navigation links removed */}
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Carousel */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Discover & Review
                <span className="text-primary block">Your Favorite Movies</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of movie enthusiasts sharing their passion for cinema.
                Rate, review, and discuss the latest releases and timeless classics.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/login">Browse Movies</Link>
                </Button>
              </div>
            </motion.div>

            {/* Movie Carousel */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="relative aspect-[2/3] max-w-md mx-auto overflow-hidden rounded-2xl shadow-2xl">
                {loading ? (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : movies.length > 0 ? (
                  movies.map((movie, index) => (
                    <motion.div
                      key={movie.id}
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: currentSlide === index ? 1 : 0,
                        scale: currentSlide === index ? 1 : 0.8,
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <Image
                        src={getTMDBImageUrl(movie.poster_path, 'w500')}
                        alt={movie.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                        <h3 className="text-white text-2xl font-bold">{movie.title}</h3>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <p className="text-muted-foreground">Failed to load movies</p>
                  </div>
                )}
              </div>
              
              {!loading && movies.length > 0 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    aria-label="Previous movie"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    aria-label="Next movie"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              <div className="flex justify-center gap-2 mt-4">
                {movies.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      currentSlide === index ? 'w-8 bg-primary' : 'w-2 bg-muted'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose CineVerse?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to explore, review, and discuss movies in one place
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={feature.link}>
                  <Card className="h-full hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-primary/10 rounded-3xl p-8 md:p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your Movie Journey?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join CineVerse today and become part of a passionate community of movie lovers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/signup">Sign Up Now</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/login">Already a member? Login</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 CineVerse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
