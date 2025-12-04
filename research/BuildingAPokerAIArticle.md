Building a Poker AI Part 6: Beating Kuhn Poker with CFR using Python

(NOTE BEFORE READING WE ARE CONCERNED WITH TEXAS HOLDEM, THIS IS JUST AN EXAMPLE OF HOW TO IMPLEMENT CFR)
Welcome back to part 6 of my series on building a Poker AI. This time, we are going to train an AI to learn an optimal strategy for Kuhn Poker through self-play. The algorithm used to train the AI will minimize expected future counterfactual regrets and is widely known by the shorthand CFR. There are multiple CFR variants, and to keep things short and easy we will concentrate on a variant called Vanilla CFR with chance sampling for 2-player games. CFR is the algorithm behind all state-of-the-art poker bots, so at the end of this article you will have the tools to beat all incomplete information games. Unfortunately, we need to deal with the thorny issue of having limited CPU power, memory and time available, so the vanilla CFR algorithm shown here will hit its limits for games much smaller than Texas Hold’em poker.

Throughout this article, we will make use of the concepts introduced in Part 5 of this series, especially counterfactual values and counterfactual regrets. I will walk through most of the code, but will leave some particularly boring parts for the single-file implementation on GitHub, found here

Press enter or click to view image in full size

Structure of the CFR Algorithm Script
We will use three classes in our algorithm:

InformationSet: This will keep track of the cumulative regrets. It will have functions to return the current strategy using regret matching, just like for Rock-Paper-Scissors in Part 4, as well as the average strategy across all training iterations. Recall that it is the average strategy that will approach a Nash equilibrium
KuhnPoker: Will implement a function to check whether a given game state is terminal, and another one to compute the payoffs for a terminal node.
KuhnPokerCFRTrainer: Contains the main CFR function that implements the 2-pass strategy we mentioned last time. It will pass probabilities down the game tree, which means calling the same function recursively. It will then aggregate payoffs weighted by how likely the corresponding action will be taken on the way back up the game tree. We also provide a training function in this class that sets things up for each CFR iteration and a function that maps from the current game state to the corresponding information set.
We also need a wrapper function so we can call the CFR training from the command line and get some diagnostics on the resulting strategy and the average payoff for the players.

The way we keep track of where we are in the game tree will be through a history string, where we add a B if a player bets or calls or a C if he passes/checks or folds. We could of course have chosen different letters for a bet and a call, but then we would need to establish first which actions a player can take in the current game state, which would make the code more complicated.

When adapting this code to other games, pay particular attention to correctly mapping the game state to an information set: While we have access to all the game state information in our training function, when later on we want to play the game, we will not know what cards our opponent holds, so any “strategy” making use of this information will fail miserably in live play!

The InformationSet class
We keep track of the cumulative regrets, and for regret matching we only use the positive regrets. What we need for a strategy is a probability distribution, so the items in our array need to be non-negative and sum to 1. For this we make use of a utility function to normalize a vector by simply dividing by the sum of its elements:

def normalize(self, strategy: np.array) -> np.array:
		if sum(strategy) > 0:
				strategy /= sum(strategy)
		else:
				strategy = np.array([1.0 / self.num_actions] * self.num_actions)
		return strategy

When we ask for the current strategy, we add this strategy to the strategy sum, weighted by the probability that we reach the current node according to our strategy in the current iteration:

def get_strategy(self, reach_probability: float) -> np.array:
		strategy = np.maximum(0, self.cumulative_regrets)
		strategy = self.normalize(strategy)

		self.strategy_sum += reach_probability * strategy
		return strategy

The KuhnPoker class
As Kuhn Poker is a simple game, we just enumerate the action history strings for the terminal game states:

def is_terminal(history: str) -> bool:
		return history in ['BC', 'BB', 'CC', 'CBB', 'CBC']

For the payoffs, there’s plenty of ways to turn this into code. I have chosen a variant that I feel strikes a reasonable balance between conciseness and readability:

def get_payoff(history: str, cards: List[str]) -> int:
		if history in ['BC', 'CBC']:
				return +1
		else:  # CC or BB or CBB
				payoff = 2 if 'B' in history else 1
				active_player = len(history) % 2
				player_card = cards[active_player]
				opponent_card = cards[(active_player + 1) % 2]
				if player_card == 'K' or opponent_card == 'J':
						return payoff
				else:
						return -payoff

The payoff is given for the currently active player, so the last action in the history string was taken by the opponent. We first treat the 2 cases where the opponent folded by checking the history string. Where it comes to a showdown, we determine who the active player is from the length of the history string, and then use the fact that the current player wins if he holds a King or if the opponent holds a Jack.

Note that this class is just a namespace for two static methods, so we could also move the functions to a module and get rid of the class altogether.

The KuhnPokerCFRTrainer class
This is where the magic happens. But before we get to the core CFR routine, let us quickly look at the rest of the class. We store a map from string to Informationset called infoset_map and implement a method to look up the correct information set. As we previously discussed, the only hidden information is the opponents’ card, so for the lookup we combine our card with a history of all the actions. The latter we conveniently already keep track of in history . We implement this in get_information_set :

def get_information_set(self, card_and_history: str) -> InformationSet:
		if card_and_history not in self.infoset_map:
				self.infoset_map[card_and_history] = InformationSet()
		return self.infoset_map[card_and_history]

We also provide a train function that sets up the game and calls the CFR routinenum_iterations times. As you can see we do not actually start the CFR call at the root node of the game tree. Instead, we use chance sampling which means we resolve the outcomes of chance nodes first, fix them, and then run the CFR algorithm. During the CFR routing we then only need to branch out on decision nodes, not on chance nodes. In a game like Kuhn Poker that may not matter too much as we only have 6 possible outcomes for the single chance node, but in Texas Hold’em, the number of possible starting hands for each player is 169, and that is before community cards have been dealt!

def train(self, num_iterations: int) -> int:
		util = 0
		kuhn_cards = ['J', 'Q', 'K']
		for _ in range(num_iterations):
				cards = random.sample(kuhn_cards, 2)
				history = ''
				reach_probabilities = np.ones(2)
				util += self.cfr(cards, history, reach_probabilities, 0)
		return util

Keeping track of the aggregated utility for the starting player is not strictly necessary, but we use it to check the correctness of our implementation against known results for the payoff Player 1 can expect with optimal play.

def cfr(
				self, 
				cards: List[str], 
				history: str, 
				reach_probabilities: np.array, 
				active_player: int) -> int:
		if KuhnPoker.is_terminal(history):
				return KuhnPoker.get_payoff(history, cards)

		my_card = cards[active_player]
		info_set = self.get_information_set(my_card + history)

		strategy = info_set.get_strategy(reach_probabilities[active_player])
		opponent = (active_player + 1) % 2
		counterfactual_values = np.zeros(len(Actions))

		for ix, action in enumerate(Actions):
				action_probability = strategy[ix]

				new_reach_probabilities = reach_probabilities.copy()
				new_reach_probabilities[active_player] *= action_probability

				counterfactual_values[ix] = -self.cfr(
						cards, history + action, new_reach_probabilities, opponent)

		node_value = counterfactual_values.dot(strategy)
		for ix, action in enumerate(Actions):
				counterfactual_regret[ix] = \
						reach_probabilities[opponent] * (counterfactual_values[ix] - node_value)
				info_set.cumulative_regrets[ix] += counterfactual_regret[ix]

		return node_value

This is the core CFR routine. We first check if we are in a terminal state and if so, return the payoff. Otherwise, we retrieve the information set and the current regret-matching strategy. Then we loop over all possible actions (lines 17–24), compute the new reach probabilities for the next game state and call the function recursively. As there are 2 players taking turns, the utility for one player is exactly -1 times the utility for the other, hence the minus sign in front of the cfr call. What we compute here for each action is in fact the counterfactual value. After the loop over all possible actions finishes, we compute the value of the current state node_value (line 26), given our current strategy, as the sum of the counterfactual values per action, weighted by the likelihood of us taking this action. We then update the cumulative counterfactual regrets by adding the node_value multiplied by the counterfactual reach probability (as we only have two players, this is just the reach probability of the opponent). Finally, we return node_value.

You can find the complete script on Github

Let us now run the code and have a look at the results to answer some of the questions from the end of the last post:

python kuhn_poker_cfr.py 100000


Results of running CFR for 100,000 iterations
As you can see, player 1 is actually at a disadvantage in this game! The intuition behind this is that acting first reveals information that the second player is then able to capitalize on.

In this particular simulation the computed game value is exactly equal to the true value, but this is not necessarily the case. CFR will only in the limit lead to a Nash Equilibrium, so convergence after 100,000 iterations is not guaranteed.

We also print the computed strategies for all information sets. Q, K and J are information sets for player 1 just after the cards have been dealt. The information set QC corresponds to the situation where player 2 holds a Queen and faces a check from Player 1. We see that the optimal strategy is to always check behind for a showdown. This makes sense: our opponent holds either a Jack or a King. If we were to bet, he would fold a Jack, so we would not achieve any additional profit compared to just checking. He would call when holding a King, costing us an extra 1$. The final three strategies again belong to Player 1, and once again we can sanity check some of them. Let us takeKCB. We are holding a King and facing a bet. As we know that we will win the showdown, clearly the correct strategy must be to always call, which is indeed what the CFR algorithm has computed.

The other question I posed last time were the initial betting frequencies for a Jack, Queen and King. If you run the code yourself, you will see that the betting frequency for a Queen will always be 0, but the ones for a Jack and a King will come out differently in each run. This is because there is actually a whole family of Nash Equilibria for Kuhn Poker! We can choose to bet a Jack between 0% and one-third of the time, and for each choice an optimal strategy exists. What will be true in all cases is that the betting frequency of a King is three times that of a Jack.

Convergence
As in the regret-matching for Rock-Paper-Scissors example, we can plot the convergence behavior of the action probabilities. Given that we have exactly 2 actions available at each decision node, we will only plot the probabilities for “Bet” or “Call”. The probability for “Check” or “Fold” is then just 1 minus the Bet/Call probability.

Press enter or click to view image in full size

First decision round — Player 1 to act
As you can see the betting probability of a Queen quickly goes to 0, while the betting probabilities for a King and a Jack wobble around quite a bit. We have a family of Nash equilibria in Kuhn Poker, so what we should plot instead is the ratio of P(bet King) / P (bet Jack):

For Player 2, convergence for most decisions is very quick. The only ones that aren’t are the decisions that depend on the betting frequency for a Jack that Player 1 uses, which are how often to call with a Queen when facing a bet and how often to bet a Jack ourselves when the opponent checked to us:

Press enter or click to view image in full size

If we get to a decision node on level 3 of the game tree, the only decision one would need to think about as a human player is whether to call with a Queen. This again depends on how often we decided to bet a Jack at the start, as this influences how often Player 2 will bet a Jack when faced with a check from our side. It is quite fascinating to see that the decision in round 3 of a hand in which we hold a Queen depends on the strategy we choose in a completely different set of hands, namely where we were dealt a Jack!

Press enter or click to view image in full size

Next time, we will have a brief look at the changes needed to extend the CFR algorithm to more than 2 players, plus a couple of tricks to improve the quality of our final strategy. We will then have a look at Leduc Hold’em. This is a poker variant that is still very simple but introduces a community card and increases the deck size from 3 cards to 6 cards.