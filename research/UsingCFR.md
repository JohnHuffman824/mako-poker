
1

Automatic Zoom
This is a preprint of an article that will appear in the Proceedings of the Ninth International Conference on Autonomous Agents and
Multiagent Systems (AAMAS), Toronto, May 2010.
Using Counterfactual Regret Minimization to Create
Competitive Multiplayer Poker Agents
Nick Abou Risk
University of Alberta
Department of Computing Science
Edmonton, AB
780-492-5468
abourisk@cs.ualberta.ca
Duane Szafron
University of Alberta
Department of Computing Science
Edmonton, AB
780-492-5468
duane@cs.ualberta.ca
ABSTRACT
Games are used to evaluate and advance Multiagent and Artificial
Intelligence techniques. Most of these games are deterministic
with perfect information (e.g. Chess and Checkers). A
deterministic game has no chance element and in a perfect
information game, all information is visible to all players.
However, many real-world scenarios with competing agents are
stochastic (non-deterministic) with imperfect information. For
two-player zero-sum perfect recall games, a recent technique
called Counterfactual Regret Minimization (CFR) computes
strategies that are provably convergent to an ε -Nash equilibrium.
A Nash equilibrium strategy is useful in two-player games since it
maximizes its utility against a worst-case opponent. However, for
multiplayer (three or more player) games, we lose all theoretical
guarantees for CFR. However, we believe that CFR-generated
agents may perform well in multiplayer games. To test this
hypothesis, we used this technique to create several 3-player limit
Texas Hold’em poker agents and two of them placed first and
second in the 3-player event of the 2009 AAAI/IJCAI Computer
Poker Competition. We also demonstrate that good strategies can
be obtained by grafting sets of two-player subgame strategies to a
3-player base strategy after one of the players is eliminated.
Categories and Subject Descriptors
I.2.8 [Artificial Intelligence] Problem Solving, Control Methods,
and Search.
General Terms
Algorithms, Economics, Performance.
Keywords
Abstraction, Game Theory, Equilibrium, Computer Poker,
Counterfactual Regret Minimization.
1. INTRODUCTION
An extensive game [13] models interactions between multiple
autonomous agents by describing sequential decision-making
scenarios, even in the context of imperfect information and non-
determinism. A game tree represents the decisions. A non-
terminal choice node exists for each player’s possible decisions.
The directed edges leaving a choice node represent the legal
actions for that player. Each terminal node contains the utilities of
all players for one potential game result. Stochastic events
(Backgammon dice rolls or Poker cards) are represented as special
nodes, for a player called the chance player. The directed edges
leaving a chance node represent the possible chance outcomes.
Since extensive games can model a wide range of strategic
decision-making scenarios, they have been used to study poker.
Recent advances in computer poker have led to substantial
advancements in solving general two player zero-sum perfect
recall extensive games. Koller and Pfeffer [10] used linear
programming to solve games with 10 8 game states. Competitors in
the AAAI/IJCAI Computer Poker Competitions (denoted CP
Competitions) [7] developed alternate techniques (gradient-based
algorithms [4] [5] [6] and counterfactual regret minimization
(CFR) [18]) to find near equilibrium strategy profiles for two-
player, zero-sum, perfect recall games with 10 12 game states.
Although these techniques compute near equilibrium strategy
profiles for large extensive games, two-player limit Texas
Hold’em (henceforth Hold’em) has 10 18 game states [1] and two-
player no-limit Hold’em has 10 71 game states [6]. Abstraction [1]
is used to reduce game size. Card abstraction combines similar
hands into buckets. Betting abstraction eliminates some betting
options. If a near equilibrium strategy is used to play in the un-
abstracted game, then translation [6] [14] is needed to select
actions in the un-abstracted game based on the abstract strategy.
Our goal is to compute winning strategies for large extensive
multiplayer games (more than two players). Specifically we
would like to derive winning strategies for 3-player limit
Hold’em, where we have computed the number of game states to
be 10 24. Some research on multiplayer extensive games has been
done for a simple poker variant [4]. Ganzfried and Sandholm used
techniques, involving extensions of fictitious play to compute ε -
Nash equilibriums for a 3-player Poker game in [2] and [3]. They
found ε -Nash equilibria for 3-player no-limit jam/fold Texas
Hold’em, a one-round Poker game where each player has two
options: fold or bet all remaining chips. These techniques require
the ability to efficiently compute best responses. Due to the
reduced betting space, the 3-player jam/fold game is fairly small
and best responses can be computed efficiently. Unfortunately,
even an abstracted version of the 3-player limit Hold’em game is
too large to use this approach. We wish to use CFR to derive
winning strategies in three-player limit Hold’em. There are two
challenges. First, CFR is only guaranteed to converge to an ε-
Nash equilibrium strategy profile for two-player zero-sum perfect
recall games [18]. Second, even if CFR generates an ε -Nash
Cite as: Using Counterfactual Regret Minimization to Create Competitive
Multiplayer Poker Agents, Nick Abou Risk and Duane Szafron, Proc. of
9th Int. Conf. on Autonomous Agents
and Multiagent Systems (AAMAS 2010), van der Hoek, Kaminka,
Lespérance, Luck and Sen (eds.), May, 10–14, 2010, Toronto, Canada,
pp. XXX-XXX. Copyright © 2010, International Foundation for
Autonomous Agents and Multiagent Systems (www.ifaamas.org). All
rights reserved.
2
equilibrium strategy, there is no guarantee that this strategy will
perform well in a multiplayer game. We show that CFR can
compute strategies that are strong enough to win the 3-player limit
Hold’em events of the 2009 CP Competition and introduce a
strategy grafting approach that shows promise for helping to
address the scalability issue in computing multiplayer strategies.
2. BACKGROUND
2.1 Poker
Poker is a class of multiplayer card games with many variants.
Several similarities exist among the variants: they use a standard
playing card deck (4 suits of 13 ranks), there are betting rounds,
and the standard five-card hand ranking system is used to
determine winner(s). Hold’em is the most popular poker variant.
In Hold’em, the pot is the collection of all chips wagered during a
game. After each game finishes, a dealer button is moved
clockwise by one position around the table. The player sitting in
that position is designated the dealer or the button. The player to
the left of the dealer is called the small blind. The player to the
left of the small blind is called the big blind. There are four
betting rounds. The preflop is the first betting round. The small
blind and big blind place mandatory bets into the pot to give
players an incentive to play hands. Each player then receives two
private cards, face-down, called hole cards. The betting begins
with the player to the left of the big blind.
The possible actions in every betting round are:
• Bet by placing a wager into the pot or raise by matching the
outstanding bet and placing an extra bet into the pot. The
minimum size of the extra bet is the difference between the
two previous bet or raise sizes.
• Call by matching the amount of all outstanding bets or check
by passing when there is no outstanding bet.
• Fold by passing when there is an outstanding bet and forfeiting
the current game. A player who has folded can take no further
actions in the current game.
After the pre-flop, the betting begins with the nearest active (non-
folded) player to the dealer’s left. The flop (second round) begins
with three public community cards and ends with betting. The
turn (third round) and river (final round) have one community
card and betting. After the river betting, all active players enter a
showdown where the hands – the best five card combination of
each agent’s two hole cards and the five community cards – are
revealed and the agent with the highest ranking hand wins the pot
or splits the pot if several agents have equivalent hands.
There are several variants of Hold’em in two orthogonal
dimensions, number of players and betting structure. The heads-
up variant has two players. The dealer is the small blind and acts
first preflop and last postflop. The multiplayer variant has more
than two players (usually three to ten). The betting structure in
limit Hold’em has a fixed amount for each bet and raise, equal to
the big blind amount for the preflop and flop rounds and equal to
twice this amount for the turn and river. In limit, there is a cap of
four bets per player per round. No-limit is a variant in which bets
and raises can be any amount between the size of the big blind
and all of a player’s remaining chips. Betting all remaining chips
is called going all-in. We focus on multiplayer limit Hold’em.
2.2 Extensive Form Games
An informal description of an extensive game was given in the
introduction. A formal definition appears on page 200 of [13], and
an excerpt appears in [14], along with formal definitions for
information set, strategy profile, Nash equilibrium, ε-Nash
equilibrium, and the best response strategy to a strategy profile.
We provide more informal descriptions of these terms.
In an imperfect information game, there are game states that each
agent cannot differentiate due to hidden information (opponent
hole cards in poker). The set of all indistinguishable game states
for a given agent is called an information set for that agent. Each
choice node, in an imperfect information extensive game,
corresponds to an information set instead of a full game state. In
poker, there are many more game states than information sets.
In an extensive game, a strategy profile is a set of strategies, one
for each player. In poker, we represent a strategy as a probability
triple (f, c, r) at each information set, where f is the probability of
folding, c is the probability of checking or calling, and r is the
probability of betting or raising, with f+c+r = 1. A best response
is a strategy that obtains the highest possible utility against the set
of all other strategies in a strategy profile. A Nash equilibrium is a
strategy profile, in which no agent can increase its utility by
unilaterally changing its strategy. Each strategy from a Nash
equilibrium strategy profile is a best response to the other
strategies in that profile. A multiplayer Nash equilibrium does not
guarantee maximum utility, regardless of what strategies are
employed by other agents. If a single agent plays a strategy from
an equilibrium profile and the other agents deviate, the single
agent could obtain reduced or increased utility by deviating from
the strategy included in the equilibrium strategy profile.
Equilibrium strategy profiles are important since for two-player
zero-sum games they have additional properties. A zero-sum
game is one in which the utility for all players sums to zero. In a
two-player zero-sum game, every strategy for a given player in a
Nash equilibrium strategy profile has the same utility and is a best
response to all the strategies in equilibrium profiles for the other
player. This means that if a player plays a strategy from one
equilibrium strategy profile, the other player cannot gain utility by
playing a strategy from a different equilibrium strategy profile (or
any other strategy). For this reason we often refer to a strategy
from a Nash equilibrium strategy profile simply as a Nash
equilibrium strategy. This result is not true with more than two
players [12] or if the game is not zero-sum. Computing an exact
Nash equilibrium for a large extensive game such as poker is
infeasible, even with extensive abstraction. Thus, we rely on
finding approximations to Nash equilibria. An ε-Nash equilibrium
is a strategy profile, in which no player can increase its utility by
more than ε by unilaterally changing its strategy.
Card abstraction is the most popular way to reduce the size of the
game tree. The simplest way to perform card abstraction is to
apply a metric to poker hands such as hand strength (E[HS]) and
to group hands that have similar metric values into the same
bucket [1]. Percentile bucketing places an approximately equal
number of hands into each bucket. Alternately, uniform bucketing
uniformly partitions the metric interval [0, 1] into buckets. With N
buckets, all hands with metric value in the [0, 1/N) range are
placed in the same bucket, all hands with value in the [1/N, 2/N)
range are together, and so on. In poker, there are many hands that
are not very strong on a given round but have the potential of
making a very strong hand on a future round (e.g. a straight or
