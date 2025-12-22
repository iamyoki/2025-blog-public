import { Octokit } from 'octokit'

export const OctokitContext = new AsyncLocalStorage<Octokit>()
