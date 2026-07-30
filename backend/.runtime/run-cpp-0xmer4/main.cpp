#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;

    vector<int> scores(n);
    for (int i = 0; i < n; i++) {
        cin >> scores[i];
    }

    int current = 1, max_streak = 1;

    for (int i = 1; i < n; i++) {
        if (scores[i] > scores[i - 1]) {
            current++;
        } else {
            current = 1;
        }
        max_streak = max(max_streak, current);
    }

    cout << max_streak;
    return 0;
}