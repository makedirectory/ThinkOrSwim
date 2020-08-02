declare upper;
input ST_Coeff = 1; # Between 1 - 100
input ST_Period = 15; # Between 1 - 100
input tradeFunds = 10000; # Int or Percent of Account Value
input calulatedMovingAverage = 200; # Days in Moving Average
input aggrPd = AggregationPeriod.FOUR_HOURS;

###############
# SuperTrend #
###############

# Heikin Ashi Stuff
# Working off of HA open, high, low, close
def hacl1 = ( open(period = aggrPd) + high(period = aggrPd) + low(period = aggrPd) + close(period = aggrPd) ) / 4;
def haop1 = CompoundValue(1, (haop1[1] + hacl1[1]) / 2, (open(period = aggrPd)[1] + close(period = aggrPd)[1]) / 2);
def hahi1 = Max( open(period = aggrPd), Max( hacl1, haop1 ) );
def halo1 = Min( low(period = aggrPd), Min( hacl1, haop1 ) );
def hahl2_1 = (hahi1 + halo1) / 2;

def iATR1 = MovingAverage(AverageType.WILDERS, TrueRange(hahi1, hacl1, halo1), ST_Period);

def tmpUp1 = hahl2_1 - (ST_Coeff * iATR1);
def tmpDn1 = hahl2_1 + (ST_Coeff * iATR1);
def finalUp1 = If(close(period = aggrPd)[1] > finalUp1[1], Max(tmpUp1, finalUp1[1]), tmpUp1);
def finalDn1 = If(close(period = aggrPd)[1] < finalDn1[1], Min(tmpDn1, finalDn1[1]), tmpDn1);
def trendDir1 = If( close(period = aggrPd) > finalDn1[1], 1, If( close(period = aggrPd) < finalUp1[1], -1, If(!IsNaN(trendDir1[1]), trendDir1[1], 1) ) );
def trendLine1 = If(trendDir1 == 1, finalUp1, finalDn1);
plot SuperTrend = trendLine1;

SuperTrend.DefineColor( "up", Color.GREEN );
SuperTrend.DefineColor( "dn", Color.RED );
SuperTrend.AssignValueColor(SuperTrend.Color("up"));
SuperTrend.AssignValueColor( if close(period = aggrPd)[1] > SuperTrend[1] then SuperTrend.Color( "up" ) else SuperTrend.Color( "dn" ) );
SuperTrend.SetLineWeight( 2 );

###############
# Strategy Calculations #
###############

def entryPrice = open(period = aggrPd)[-1];
def exitPrice = open(period = aggrPd)[-1];
def tSize = Round(Average(tradeFunds / entryPrice));

def bullmk = ( close(period = aggrPd)[-1] > SuperTrend[-1] and close(period = aggrPd)[0] < SuperTrend[0] ) ;
def bearmk = ( close(period = aggrPd)[-1] < SuperTrend[-1] and close(period = aggrPd)[0] > SuperTrend[0] );

# Bull Market BUY
AddOrder(OrderType.BUY_TO_OPEN, bullmk, price = entryPrice, tradeSize = tSize, tickcolor = GetColor(0), arrowcolor = GetColor(1));
# Buy Alert
Alert(bullmk, Sound.Chimes, Alert.BAR);

# Bull Market SELL
AddOrder(OrderType.SELL_TO_CLOSE, bearmk, price = exitPrice, tradeSize = tSize, tickcolor = GetColor(1), arrowcolor = GetColor(0));
#Sell Alert
Alert(bearmk, Sound.Chimes, Alert.BAR);
