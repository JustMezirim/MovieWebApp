import React from 'react'
import { useEffect, useState } from 'react';
import { useDebounce } from 'react-use'
import { motion } from 'framer-motion';
import Search from './components/Search';
import Spinner from './components/spinner';
import MovieCard from './components/MovieCard';
import { getTrendingMovies, updateSearchCount } from './appwrite';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTION = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  }
}

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [trendingMovies, setTrendingMovies] = useState([])
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [typingComplete, setTypingComplete] = useState(false);

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const endpoint = query 
        ? `${API_BASE_URL}/search/movie?include_adult=false&language=en-US&page=1&query=${encodeURIComponent(query)}` 
        : `${API_BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTION);

      if(!response.ok){
        throw new Error('Failed to fetch movies');
      }

      const data = await response.json();

      if(data.Response === 'False') {
        setErrorMessage(data.Error || 'Failed to fetch movies')
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);

      if(query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0])
      }
    } catch (error) {
      console.error(`Error fetching movies: ${error}`)
      setErrorMessage('Error fetching movies')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies()
      setTrendingMovies(movies);
    } catch(error) {
      console.error(`Error fetching trending movies ${error}`);
    }
  }
  
  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm])

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  const headingText = [
    ...Array.from("Find ").map(char => ({ char, isGradient: false })),
    ...Array.from("Movies").map(char => ({ char, isGradient: true })),
    ...Array.from(" You'll Enjoy Without the Hassle").map(char => ({ char, isGradient: false }))
  ];
  
  const sentence = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.3
      }
    }
  };
  
  const letter = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", damping: 12 }
    }
  };

  const handleAnimationComplete = () => {
    setTypingComplete(true);
  };

  return (
    <main>
      <div className='pattern'></div>
      <div className='wrapper'></div>
      
      <header>
        <img src="./hero-img.png" alt="Hero Banner" />
        
        <motion.h1
          variants={sentence}
          initial="hidden"
          animate="visible"
          onAnimationComplete={handleAnimationComplete}
        >

          {headingText.map((item, index) => (
            <motion.span 
              key={index} 
              variants={letter}
              className={item.isGradient ? 'text-gradient' : ''}
            >
              {item.char}
            </motion.span>
          ))}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: typingComplete ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </motion.div>
      </header>

      {trendingMovies.length > 0 && (
        <section className='trending'>
          <h2>Trending Movies</h2>

          <ul>
            {trendingMovies.map((movie, index) => (
              <motion.li 
                key={movie.$id}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <p>{index + 1}</p>
                <img src={movie.poster_url || "/placeholder.svg"} alt={movie.title} />
              </motion.li>
            ))}
          </ul>
        </section>
      )}

      <section className='all-movies'>
        <h2>All Movies</h2>

        {isLoading ? (
          <Spinner />
        ) : errorMessage ? (
          <p className='text-red-500'>{errorMessage}</p>
        ) : (
          <ul>
            {movieList.map((movie) => (
              <motion.div
                key={movie.id}
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <MovieCard movie={movie}/>
              </motion.div>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App