import java.util.*;
import java.io.*;

public class Main {
	public static void main(String[] args) {
		Scanner in  = new Scanner(System.in);
		int testcase = in.nextInt();
		while (testcase-- > 0) {
			int number = in.nextInt();
			int xor = 0;
			boolean allOnes = true;
			for (int i = 1; i <= number; ++i) {
				int temp = in.nextInt();
				if (temp != 1) {
					allOnes = false;
				}
				xor ^= temp;
			}
			if (allOnes) {
				if (xor == 0) {
					System.out.println("John");
				} else {
					System.out.println("Brother");
				}
			} else {
				if (xor == 0) {
					System.out.println("Brother");
				} else {
					System.out.println("John");
				}
			}
		}
	}
}